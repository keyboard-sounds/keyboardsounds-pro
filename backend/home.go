package backend

import (
	"os"
	"path/filepath"
)

// GetHomeDirectory returns the home directory for the keyboard sounds backend. This is the directory
// where profiles, rules and other data required by the backend are stored.
//
// On Windows, this is typically `%USERPROFILE%\keyboardsounds-pro`.
//
// On macOS and Linux, this is typically `~/keyboardsounds-pro`.
func GetHomeDirectory() string {
	userDir, err := os.UserHomeDir()
	if err != nil {
		panic(err)
	}

	return filepath.Join(userDir, "keyboardsounds-pro")
}
