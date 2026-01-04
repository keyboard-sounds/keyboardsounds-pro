package rules

// InstalledApplication represents an installed application on the system.
type InstalledApplication struct {
	// Name is the name of the application.
	Name string `json:"name"`
	// ExecutablePath is the path to the executable of the application.
	// This can be a glob pattern.
	ExecutablePath string `json:"executable_path"`
}
