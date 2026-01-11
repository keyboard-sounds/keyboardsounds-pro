package rules

// GetInstalledApplications returns a list of installed applications on the system.
// On Linux, this returns an empty list.
// On Windows, this reads installed applications from the Windows registry.
func GetInstalledApplications() []InstalledApplication {
	return []InstalledApplication{}
}
