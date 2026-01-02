package rules

type InstalledApplication struct {
	Name           string `json:"name"`
	ExecutablePath string `json:"executable_path"`
}
