//go:build !windows
// +build !windows

package oskhelpers

import "fmt"

// unsupportedOSKHelper is a stub implementation for unsupported platforms
type unsupportedOSKHelper struct{}

// NewOSKHelper returns an error indicating the platform is not supported
func NewOSKHelper() (OSKHelper, error) {
	return nil, fmt.Errorf("OSKHelper is not supported on this platform")
}

// SetOnScreenText is not implemented for unsupported platforms
func (u *unsupportedOSKHelper) SetOnScreenText(config OSKHelperConfig, text string) error {
	return fmt.Errorf("OSKHelper is not supported on this platform")
}

// ClearOnScreenText is not implemented for unsupported platforms
func (u *unsupportedOSKHelper) ClearOnScreenText() error {
	return fmt.Errorf("OSKHelper is not supported on this platform")
}

// MonitorInfo represents information about a display monitor
type MonitorInfo struct {
	Index     int  `json:"index"`
	IsPrimary bool `json:"isPrimary"`
	Left      int  `json:"left"`
	Top       int  `json:"top"`
	Width     int  `json:"width"`
	Height    int  `json:"height"`
}

// GetMonitors returns an empty list on unsupported platforms
func GetMonitors() []MonitorInfo {
	return []MonitorInfo{}
}
