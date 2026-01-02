package rules

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/samber/lo"
	"golang.org/x/sys/windows/registry"
)

// GetInstalledApplicationsWindows reads installed applications from the Windows registry.
func GetInstalledApplications() []InstalledApplication {
	apps := make([]InstalledApplication, 0)

	regPaths := []struct {
		root registry.Key
		path string
	}{
		{registry.LOCAL_MACHINE, `SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`},
		{registry.CURRENT_USER, `SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`},
		{registry.LOCAL_MACHINE, `SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall`},
	}

	for _, regPath := range regPaths {
		key, err := registry.OpenKey(regPath.root, regPath.path, registry.READ)
		if err != nil {
			continue
		}

		subkeyNames, err := key.ReadSubKeyNames(-1)
		key.Close()
		if err != nil {
			continue
		}

		for _, subkeyName := range subkeyNames {
			subkey, err := registry.OpenKey(regPath.root, regPath.path+`\`+subkeyName, registry.READ)
			if err != nil {
				continue
			}

			appName, _, err := subkey.GetStringValue("DisplayName")
			if err != nil {
				subkey.Close()
				continue
			}

			var exePath string

			// Try to find the executable from the DisplayIcon value
			displayIcon, _, err := subkey.GetStringValue("DisplayIcon")
			if err == nil && displayIcon != "" {
				if strings.Contains(strings.ToLower(displayIcon), ".exe") {
					exePath = displayIcon
				}
			}

			// Try to find the executable path from InstallLocation
			if exePath == "" {
				installLocation, _, err := subkey.GetStringValue("InstallLocation")
				if err == nil && installLocation != "" {
					installLocation = strings.Trim(installLocation, `"`)

					if strings.Contains(strings.ToLower(installLocation), ".exe") {
						exePath = installLocation
					} else if info, err := os.Stat(installLocation); err == nil && info.IsDir() {
						// Scan directory for .exe files
						entries, err := os.ReadDir(installLocation)
						if err == nil {
							for _, entry := range entries {
								if !entry.IsDir() && strings.HasSuffix(strings.ToLower(entry.Name()), ".exe") {
									exePath = filepath.Join(installLocation, entry.Name())
									break
								}
							}
						}
					}
				}
			}

			subkey.Close()

			if exePath != "" {
				// Remove ",0" suffix if present
				if strings.HasSuffix(strings.ToLower(exePath), ",0") {
					exePath = strings.Split(exePath, ",")[0]
				}

				apps = append(apps, InstalledApplication{
					Name:           appName,
					ExecutablePath: exePath,
				})
			}
		}
	}

	// Remove duplicates by executable path
	seen := make(map[string]bool)
	uniqueApps := make([]InstalledApplication, 0, len(apps))
	for _, app := range apps {
		lowerPath := strings.ToLower(app.ExecutablePath)
		if !seen[lowerPath] {
			seen[lowerPath] = true
			uniqueApps = append(uniqueApps, app)
		}
	}

	// Apply overrides
	overrides := getOverrides()
	for _, override := range overrides {
		if lo.ContainsBy(uniqueApps, func(app InstalledApplication) bool {
			return app.Name == override.Name
		}) {
			// Override the app with the override
			uniqueApps = lo.Filter(uniqueApps, func(app InstalledApplication, _ int) bool {
				return app.Name != override.Name
			})
			uniqueApps = append(uniqueApps, override)
		}
	}

	return uniqueApps
}

func getOverrides() []InstalledApplication {
	overrides := []InstalledApplication{}

	userDir, err := os.UserHomeDir()
	if err != nil {
		return overrides
	}

	overrides = append(overrides, InstalledApplication{
		Name:           "Discord",
		ExecutablePath: filepath.Join(userDir, "AppData", "Local", "Discord", "*", "Discord.exe"),
	})

	return overrides
}
