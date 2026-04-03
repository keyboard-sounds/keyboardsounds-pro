//go:build !darwin

package app

// InputMonitoringAccessGranted is only enforced on macOS; other platforms always allow the UI.
func InputMonitoringAccessGranted() bool {
	return true
}

func RequestInputMonitoringAccess() {}

func OpenInputMonitoringSystemSettings() error {
	return nil
}
