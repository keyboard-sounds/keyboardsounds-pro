//go:build darwin

package rules

/*
#cgo CFLAGS: -x objective-c -fobjc-arc
#cgo LDFLAGS: -framework AppKit -framework ApplicationServices -framework CoreFoundation -lproc

#include <ApplicationServices/ApplicationServices.h>
#include <CoreFoundation/CoreFoundation.h>
#include <libproc.h>
#import <AppKit/AppKit.h>
#include <dispatch/dispatch.h>
#include <stdlib.h>
#include <string.h>

// getFrontmostAppPath writes the executable path of the frontmost application
// into buf (at most bufsize bytes, including null) and returns the path length.
// Returns positive length on success. Returns 0 if no focused app or proc_pidpath failed.
// Returns negative AXError on accessibility failure (e.g. -25211 = kAXErrorAPIDisabled = permission denied).
//
// Tries kAXFocusedApplicationAttribute first; on kAXErrorCannotComplete (-25204) falls back to
// kAXFocusedUIElementAttribute and gets the PID from that element (works when system-wide
// focused-application query fails on some macOS versions).
static int getFrontmostAppPath(char *buf, size_t bufsize) {
	if (buf == NULL || bufsize == 0)
		return 0;

	AXUIElementRef systemWide = AXUIElementCreateSystemWide();
	if (systemWide == NULL)
		return 0;

	pid_t pid = 0;

	CFTypeRef focusedAppRef = NULL;
	AXError err = AXUIElementCopyAttributeValue(systemWide, kAXFocusedApplicationAttribute, &focusedAppRef);
	if (err == kAXErrorSuccess && focusedAppRef != NULL) {
		err = AXUIElementGetPid((AXUIElementRef)focusedAppRef, &pid);
		CFRelease(focusedAppRef);
		if (err == kAXErrorSuccess && pid != 0) {
			CFRelease(systemWide);
			int ret = proc_pidpath(pid, buf, (uint32_t)bufsize);
			return (ret > 0) ? ret : 0;
		}
	} else if (focusedAppRef != NULL) {
		CFRelease(focusedAppRef);
	}

	if (err == (AXError)-25211) {
		CFRelease(systemWide);
		return (int)err;
	}

	CFTypeRef focusedElementRef = NULL;
	err = AXUIElementCopyAttributeValue(systemWide, kAXFocusedUIElementAttribute, &focusedElementRef);
	CFRelease(systemWide);
	if (err != kAXErrorSuccess || focusedElementRef == NULL) {
		if (err != kAXErrorSuccess)
			return (int)err;
		return 0;
	}

	err = AXUIElementGetPid((AXUIElementRef)focusedElementRef, &pid);
	CFRelease(focusedElementRef);
	if (err != kAXErrorSuccess || pid == 0)
		return (err != kAXErrorSuccess) ? (int)err : 0;

	int ret = proc_pidpath(pid, buf, (uint32_t)bufsize);
	return (ret > 0) ? ret : 0;
}

// getFrontmostAppPathNSWorkspace uses NSWorkspace frontmostApplication (PID) and proc_pidpath.
// Runs the AppKit call on the main thread when necessary to avoid threading issues and deadlock.
// Returns positive path length on success, 0 if no frontmost app or proc_pidpath failed.
static int getFrontmostAppPathNSWorkspace(char *buf, size_t bufsize) {
	if (buf == NULL || bufsize == 0)
		return 0;
	__block int outLen = 0;
	void (^query)(void) = ^{
		NSRunningApplication *app = [[NSWorkspace sharedWorkspace] frontmostApplication];
		if (app == nil)
			return;
		pid_t pid = [app processIdentifier];
		if (pid <= 0)
			return;
		int ret = proc_pidpath(pid, buf, (uint32_t)bufsize);
		if (ret > 0)
			outLen = ret;
	};
	if ([NSThread isMainThread]) {
		query();
	} else {
		dispatch_sync(dispatch_get_main_queue(), query);
	}
	return outLen;
}
*/
import "C"

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"
	"unsafe"
)

type darwinFocusDetector struct {
	events chan FocusEvent
	mu     sync.Mutex
}

// NewFocusDetector creates a new application focus detector for macOS using the
// Accessibility API when available, then NSWorkspace + libproc, to report the frontmost
// application's executable path.
func NewFocusDetector() FocusDetector {
	return &darwinFocusDetector{
		events: make(chan FocusEvent, 100),
	}
}

// Listen starts the focus detector. It runs a polling loop until ctx is cancelled.
// Accessibility (System Settings → Privacy & Security → Accessibility) improves accuracy;
// NSWorkspace fallback works without Accessibility for basic frontmost-app detection.
func (d *darwinFocusDetector) Listen(ctx context.Context) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	go d.pollLoop(ctx)
	return nil
}

// Events returns a channel that emits focus events when the frontmost application changes.
func (d *darwinFocusDetector) Events() chan FocusEvent {
	return d.events
}

const (
	// kAXErrorAPIDisabled: process is not trusted for accessibility (permission denied).
	axErrorAPIDisabled = 25211
	// kAXErrorCannotComplete: messaging failed or target app busy; we try a fallback (focused UI element) automatically.
	axErrorCannotComplete = 25204
	// kAXErrorNoValue: attribute has no value — common for some Electron apps (e.g. Discord) that do not expose
	// kAXFocusedApplicationAttribute / kAXFocusedUIElementAttribute reliably to the system-wide observer.
	axErrorNoValue = 25212
)

// axErrorName returns a short label for slog when logging AX error codes from getFrontmostPathWithError.
func axErrorName(code int32) string {
	switch code {
	case 0:
		return "none"
	case axErrorAPIDisabled:
		return "kAXErrorAPIDisabled(25211)"
	case axErrorCannotComplete:
		return "kAXErrorCannotComplete(25204)"
	case axErrorNoValue:
		return "kAXErrorNoValue(25212)"
	default:
		return fmt.Sprintf("AXError(%d)", code)
	}
}

func (d *darwinFocusDetector) pollLoop(ctx context.Context) {
	const (
		pollInterval = 250 * time.Millisecond
		bufSize      = C.PROC_PIDPATHINFO_MAXSIZE
	)
	var lastPath string
	var axErrorLogged bool
	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	slog.Info("focus detector: poll loop started", "interval", pollInterval)

	logPoll := func(path string, axErr int32, usedNSWorkspace bool, event string) {
		if axErr != 0 && path == "" {
			slog.Warn("focus detector: poll failed",
				"ax_err", axErr,
				"path_resolved", path != "",
				"path", path,
				"ax_err_name", axErrorName(axErr),
				"ns_workspace_fallback", usedNSWorkspace,
				"emit", event,
			)
		}
	}

	resolve := func() (path string, axErr int32, usedNSWorkspace bool) {
		path, axErr = d.getFrontmostPathWithError(bufSize)
		if path != "" {
			return path, axErr, false
		}
		// NSWorkspace does not require Accessibility or Automation; preferred for sandboxed builds.
		if ws := d.getFrontmostPathViaNSWorkspace(bufSize); ws != "" {
			return ws, axErr, true
		}
		return "", axErr, false
	}

	// Initial snapshot: AX first, then NSWorkspace when AX yields no path.
	path, axErr, usedWS := resolve()
	logPoll(path, axErr, usedWS, "initial")
	if axErr != 0 && path == "" && !axErrorLogged {
		axErrorLogged = true
		d.logAXError(axErr)
	}
	if path != "" {
		slog.Info("focus detector: initial frontmost executable",
			"executable", path,
			"ax_err", axErr,
			"ax_err_name", axErrorName(axErr),
			"ns_workspace_fallback", usedWS,
		)
		lastPath = path
		select {
		case d.events <- FocusEvent{Executable: path}:
		default:
		}
	}

	for {
		select {
		case <-ctx.Done():
			slog.Debug("focus detector: poll loop stopped")
			return
		case <-ticker.C:
			path, axErr, usedWS := resolve()
			if path == "" {
				if axErr != 0 && !axErrorLogged {
					axErrorLogged = true
					d.logAXError(axErr)
				}
				logPoll(path, axErr, usedWS, "empty")
				continue
			}
			if path == lastPath {
				continue
			}
			lastPath = path
			slog.Info("focus detector: frontmost executable changed",
				"executable", path,
				"ax_err", axErr,
				"ax_err_name", axErrorName(axErr),
				"ns_workspace_fallback", usedWS,
			)
			emit := "event"
			select {
			case d.events <- FocusEvent{Executable: path}:
			default:
				slog.Debug("focus detector events channel full, dropping event")
				emit = "channel_full"
			}
			logPoll(path, axErr, usedWS, emit)
		}
	}
}

func (d *darwinFocusDetector) logAXError(axErr int32) {
	switch axErr {
	case axErrorAPIDisabled:
		slog.Warn("focus detector: Accessibility API denied for this process (25211); using NSWorkspace fallback — enable Accessibility for best results")
	case axErrorCannotComplete:
		slog.Warn("focus detector: accessibility cannot complete (code 25204); ensure this app has Accessibility permission and no other app is blocking; NSWorkspace fallback will still run")
	case axErrorNoValue:
		slog.Warn("focus detector: accessibility returned no value for focused app (code 25212); NSWorkspace fallback will still run; try restarting the frontmost app if focus is wrong")
	default:
		slog.Warn("focus detector: accessibility API error", "code", axErr)
	}
}

// getFrontmostPathWithError returns the executable path of the frontmost app and the AX error code (0 on success or when path is returned).
func (d *darwinFocusDetector) getFrontmostPathWithError(bufSize int) (path string, axError int32) {
	buf := (*C.char)(C.malloc(C.size_t(bufSize)))
	defer C.free(unsafe.Pointer(buf))
	n := C.getFrontmostAppPath(buf, C.size_t(bufSize))
	if n > 0 {
		return C.GoStringN(buf, C.int(n)), 0
	}
	if n < 0 {
		return "", int32(-n) // C returns -AXError
	}
	return "", 0
}

// getFrontmostPathViaNSWorkspace returns the frontmost application's executable path using
// NSWorkspace.frontmostApplication and proc_pidpath. Suitable for sandboxed apps (no osascript).
func (d *darwinFocusDetector) getFrontmostPathViaNSWorkspace(bufSize int) string {
	buf := (*C.char)(C.malloc(C.size_t(bufSize)))
	defer C.free(unsafe.Pointer(buf))
	n := C.getFrontmostAppPathNSWorkspace(buf, C.size_t(bufSize))
	if n > 0 {
		return C.GoStringN(buf, C.int(n))
	}
	return ""
}
