//go:build darwin

package app

/*
#cgo LDFLAGS: -framework CoreGraphics
#include <CoreGraphics/CoreGraphics.h>
*/
import "C"

import (
	"os/exec"
	"strconv"
	"strings"
)

// InputMonitoringAccessGranted reports whether this app may listen to HID events (Input Monitoring).
func InputMonitoringAccessGranted() bool {
	return bool(C.CGPreflightListenEventAccess())
}

// RequestInputMonitoringAccess triggers the system consent flow so the app appears under Input Monitoring.
func RequestInputMonitoringAccess() {
	C.CGRequestListenEventAccess()
}

func macOSMajorVersion() int {
	out, err := exec.Command("sw_vers", "-productVersion").Output()
	if err != nil {
		return 0
	}
	parts := strings.Split(strings.TrimSpace(string(out)), ".")
	if len(parts) == 0 {
		return 0
	}
	n, _ := strconv.Atoi(parts[0])
	return n
}

// OpenInputMonitoringSystemSettings opens Privacy & Security → Input Monitoring in System Settings (or System Preferences).
func OpenInputMonitoringSystemSettings() error {
	var url string
	if macOSMajorVersion() >= 13 {
		url = "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Listen_Event"
	} else {
		url = "x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent"
	}
	return exec.Command("open", url).Run()
}
