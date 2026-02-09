//go:build !windows
// +build !windows

package oskhelpers

// unsupportedOSKHelper is a stub implementation for unsupported platforms
type unsupportedOSKHelper struct{}

// newOSKHelper returns an error indicating the platform is not supported
func newOSKHelper() (OSKHelper, error) {
	return &unsupportedOSKHelper{}, nil
}

// SetOnScreenText is not implemented for unsupported platforms
func (u *unsupportedOSKHelper) SetOnScreenText(config OSKHelperConfig, text string) error {
	return nil
}

// ClearOnScreenText is not implemented for unsupported platforms
func (u *unsupportedOSKHelper) ClearOnScreenText() error {
	return nil
}

// ForceDismiss is not implemented for unsupported platforms
func (u *unsupportedOSKHelper) ForceDismiss() error {
	return nil
}

// GetMonitors returns an empty list on unsupported platforms
func GetMonitors() []MonitorInfo {
	return []MonitorInfo{}
}
