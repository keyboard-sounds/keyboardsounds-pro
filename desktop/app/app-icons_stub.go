//go:build !darwin

package app

// GetMacOSApplicationIcon returns a PNG data URL for a macOS .app bundle icon.
// On non-macOS platforms this always returns an empty string.
func (a *AppRules) GetMacOSApplicationIcon(executablePath string) (string, error) {
	return "", nil
}

