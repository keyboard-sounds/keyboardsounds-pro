//go:build darwin

package rules

/*
#cgo LDFLAGS: -framework ApplicationServices -framework CoreFoundation -lproc

#include <ApplicationServices/ApplicationServices.h>
#include <CoreFoundation/CoreFoundation.h>
#include <libproc.h>
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

static int getPathForPID(int pid, char *buf, size_t bufsize) {
	if (buf == NULL || bufsize == 0 || pid <= 0)
		return 0;
	int ret = proc_pidpath((pid_t)pid, buf, (uint32_t)bufsize);
	return (ret > 0) ? ret : 0;
}
*/
import "C"

import (
	"context"
	"log/slog"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"
	"unsafe"
)

type darwinFocusDetector struct {
	events chan FocusEvent
	mu     sync.Mutex
}

// NewFocusDetector creates a new application focus detector for macOS using the
// Accessibility API and libproc to report the frontmost application's executable path.
func NewFocusDetector() FocusDetector {
	return &darwinFocusDetector{
		events: make(chan FocusEvent, 100),
	}
}

// Listen starts the focus detector. It runs a polling loop until ctx is cancelled.
// Requires accessibility permission (System Settings → Privacy & Security → Accessibility).
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
)

func (d *darwinFocusDetector) pollLoop(ctx context.Context) {
	const (
		pollInterval = 250 * time.Millisecond
		bufSize      = C.PROC_PIDPATHINFO_MAXSIZE
	)
	var lastPath string
	var axErrorLogged bool
	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	// Initial snapshot: try AX first, then AppleScript fallback on 25204
	path, axErr := d.getFrontmostPathWithError(bufSize)
	if path == "" && (axErr == axErrorCannotComplete || axErr == 0) {
		path = d.getFrontmostPathViaAppleScript(bufSize)
	}
	if axErr != 0 && path == "" && !axErrorLogged {
		axErrorLogged = true
		d.logAXError(axErr)
	}
	if path != "" {
		lastPath = path
		select {
		case d.events <- FocusEvent{Executable: path}:
		default:
		}
	}

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			path, axErr := d.getFrontmostPathWithError(bufSize)
			if path == "" && (axErr == axErrorCannotComplete || axErr == 0) {
				path = d.getFrontmostPathViaAppleScript(bufSize)
			}
			if axErr != 0 && path == "" && !axErrorLogged {
				axErrorLogged = true
				d.logAXError(axErr)
			}
			if path == "" {
				continue
			}
			if path != lastPath {
				lastPath = path
				select {
				case d.events <- FocusEvent{Executable: path}:
				default:
					slog.Debug("focus detector events channel full, dropping event")
				}
			}
		}
	}
}

func (d *darwinFocusDetector) logAXError(axErr int32) {
	switch axErr {
	case axErrorAPIDisabled:
		slog.Warn("focus detector: accessibility permission denied — add this app in System Settings → Privacy & Security → Accessibility, then restart")
	case axErrorCannotComplete:
		slog.Warn("focus detector: accessibility cannot complete (code 25204); ensure this app has Accessibility permission and no other app is blocking")
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

// getFrontmostPathViaAppleScript returns the frontmost application's executable path by asking
// System Events via osascript. Used when the Accessibility API returns 25204 (CannotComplete).
// May prompt for "Automation" permission (Terminal/app to control System Events) the first time.
func (d *darwinFocusDetector) getFrontmostPathViaAppleScript(bufSize int) string {
	cmd := exec.Command("osascript", "-e", `tell application "System Events" to get unix id of first process whose frontmost is true`)
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	pidStr := strings.TrimSpace(string(out))
	pid, err := strconv.Atoi(pidStr)
	if err != nil || pid <= 0 {
		return ""
	}
	buf := (*C.char)(C.malloc(C.size_t(bufSize)))
	defer C.free(unsafe.Pointer(buf))
	n := C.getPathForPID(C.int(pid), buf, C.size_t(bufSize))
	if n <= 0 {
		return ""
	}
	return C.GoStringN(buf, C.int(n))
}
