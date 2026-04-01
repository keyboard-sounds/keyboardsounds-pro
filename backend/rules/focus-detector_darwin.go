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
	"fmt"
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
	var scriptFailLogged bool
	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	slog.Info("focus detector: poll loop started", "interval", pollInterval)

	logPoll := func(path string, axErr int32, usedAppleScript bool, scriptErr error, event string) {
		if axErr != 0 || scriptErr != nil {
			slog.Warn("focus detector: poll failed",
				"ax_err", axErr,
				"path_resolved", path != "",
				"path", path,
				"ax_err_name", axErrorName(axErr),
				"applescript_attempted", usedAppleScript,
				"applescript_err", scriptErr,
				"emit", event,
			)
		}
	}

	resolve := func() (path string, axErr int32, usedAppleScript bool, scriptErr error) {
		path, axErr = d.getFrontmostPathWithError(bufSize)
		// AppleScript asks System Events for the frontmost process — it uses Automation / Apple Events, not AX.
		// Fall back when AX gives no path: transient errors (25204, 25212), empty result (0), or API disabled (25211)
		// so focus rules still work when Accessibility is denied to this process but System Events automation is allowed.
		if path == "" && (axErr == axErrorCannotComplete || axErr == axErrorNoValue || axErr == 0 || axErr == axErrorAPIDisabled) {
			usedAppleScript = true
			path, scriptErr = d.getFrontmostPathViaAppleScript(bufSize)
		}
		return path, axErr, usedAppleScript, scriptErr
	}

	// Initial snapshot: try AX first, then AppleScript when AX has no usable frontmost path.
	path, axErr, usedAS, scriptErr := resolve()
	logPoll(path, axErr, usedAS, scriptErr, "initial")
	if axErr != 0 && path == "" && !axErrorLogged {
		axErrorLogged = true
		d.logAXError(axErr)
	}
	if usedAS && path == "" && scriptErr != nil && !scriptFailLogged {
		scriptFailLogged = true
		slog.Warn("focus detector: AppleScript frontmost lookup failed (subsequent failures at Debug only)", "error", scriptErr)
	}
	if path != "" {
		slog.Info("focus detector: initial frontmost executable",
			"executable", path,
			"ax_err", axErr,
			"ax_err_name", axErrorName(axErr),
			"applescript_attempted", usedAS,
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
			path, axErr, usedAS, scriptErr := resolve()
			if path == "" {
				if axErr != 0 && !axErrorLogged {
					axErrorLogged = true
					d.logAXError(axErr)
				}
				if usedAS && scriptErr != nil && !scriptFailLogged {
					scriptFailLogged = true
					slog.Warn("focus detector: AppleScript frontmost lookup failed (subsequent failures at Debug only)", "error", scriptErr)
				}
				logPoll(path, axErr, usedAS, scriptErr, "empty")
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
				"applescript_attempted", usedAS,
			)
			emit := "event"
			select {
			case d.events <- FocusEvent{Executable: path}:
			default:
				slog.Debug("focus detector events channel full, dropping event")
				emit = "channel_full"
			}
			logPoll(path, axErr, usedAS, scriptErr, emit)
		}
	}
}

func (d *darwinFocusDetector) logAXError(axErr int32) {
	switch axErr {
	case axErrorAPIDisabled:
		slog.Warn("focus detector: Accessibility API denied for this process (25211); trying AppleScript/System Events fallback — fix Accessibility for this executable, or ensure Automation allows this app to control System Events")
	case axErrorCannotComplete:
		slog.Warn("focus detector: accessibility cannot complete (code 25204); ensure this app has Accessibility permission and no other app is blocking")
	case axErrorNoValue:
		slog.Warn("focus detector: accessibility returned no value for focused app (code 25212); if focus still fails, allow Automation for System Events (AppleScript fallback) or try restarting the frontmost app")
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
// System Events via osascript. Used when AX does not yield a path (e.g. 25204, 25212, 25211, or empty).
// Does not require Accessibility trust; requires Automation permission for this app to control System Events.
// May prompt for "Automation" permission the first time.
func (d *darwinFocusDetector) getFrontmostPathViaAppleScript(bufSize int) (string, error) {
	cmd := exec.Command("osascript", "-e", `tell application "System Events" to get unix id of first process whose frontmost is true`)
	out, err := cmd.Output()
	if err != nil {
		var stderr string
		if exitErr, ok := err.(*exec.ExitError); ok && len(exitErr.Stderr) > 0 {
			stderr = strings.TrimSpace(string(exitErr.Stderr))
		}
		if stderr != "" {
			return "", fmt.Errorf("osascript: %w (stderr: %s)", err, stderr)
		}
		return "", fmt.Errorf("osascript: %w", err)
	}
	pidStr := strings.TrimSpace(string(out))
	pid, err := strconv.Atoi(pidStr)
	if err != nil {
		return "", fmt.Errorf("parse osascript pid %q: %w", pidStr, err)
	}
	if pid <= 0 {
		return "", fmt.Errorf("invalid pid from osascript: %d", pid)
	}
	buf := (*C.char)(C.malloc(C.size_t(bufSize)))
	defer C.free(unsafe.Pointer(buf))
	n := C.getPathForPID(C.int(pid), buf, C.size_t(bufSize))
	if n <= 0 {
		return "", fmt.Errorf("proc_pidpath failed for pid %d", pid)
	}
	return C.GoStringN(buf, C.int(n)), nil
}
