//go:build darwin

package rules

import (
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"howett.net/plist"
)

// GetInstalledApplications returns a list of installed applications on the system.
// On Darwin, this scans well-known Application folders for .app bundles and resolves
// each bundle’s main executable from Info.plist.
func GetInstalledApplications() []InstalledApplication {
	roots := []string{
		"/Applications",
		"/System/Applications",
	}
	if home, err := os.UserHomeDir(); err == nil {
		roots = append(roots, filepath.Join(home, "Applications"))
	}

	apps := make([]InstalledApplication, 0, 64)
	seenBundle := make(map[string]struct{})

	for _, root := range roots {
		_ = filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return nil
			}
			if !d.IsDir() || !strings.HasSuffix(path, ".app") {
				return nil
			}

			// Resolve symlinks so duplicates across paths dedupe correctly.
			real, err := filepath.EvalSymlinks(path)
			if err != nil {
				real = path
			}
			if _, ok := seenBundle[strings.ToLower(real)]; ok {
				return filepath.SkipDir
			}
			seenBundle[strings.ToLower(real)] = struct{}{}

			if app, ok := installedAppFromBundle(real); ok {
				apps = append(apps, app)
			}
			return filepath.SkipDir
		})
	}

	seenExe := make(map[string]bool)
	unique := make([]InstalledApplication, 0, len(apps))
	for _, app := range apps {
		key := strings.ToLower(app.ExecutablePath)
		if !seenExe[key] {
			seenExe[key] = true
			unique = append(unique, app)
		}
	}

	return unique
}

func installedAppFromBundle(bundlePath string) (InstalledApplication, bool) {
	plistPath := filepath.Join(bundlePath, "Contents", "Info.plist")
	data, err := os.ReadFile(plistPath)
	if err != nil {
		return InstalledApplication{}, false
	}

	var raw map[string]interface{}
	if _, err := plist.Unmarshal(data, &raw); err != nil {
		return InstalledApplication{}, false
	}

	exeName := plistString(raw["CFBundleExecutable"])
	if exeName == "" {
		return InstalledApplication{}, false
	}

	exePath := filepath.Join(bundlePath, "Contents", "MacOS", exeName)
	if st, err := os.Stat(exePath); err != nil || st.IsDir() {
		return InstalledApplication{}, false
	}

	name := plistString(raw["CFBundleDisplayName"])
	if name == "" {
		name = plistString(raw["CFBundleName"])
	}
	if name == "" {
		name = strings.TrimSuffix(filepath.Base(bundlePath), ".app")
	}

	return InstalledApplication{
		Name:           name,
		ExecutablePath: exePath,
	}, true
}

func plistString(v interface{}) string {
	switch x := v.(type) {
	case string:
		return strings.TrimSpace(x)
	case []byte:
		return strings.TrimSpace(string(x))
	case map[string]interface{}:
		for _, k := range []string{"en", "en-US", "en-GB", "default"} {
			if s := plistString(x[k]); s != "" {
				return s
			}
		}
		for _, val := range x {
			if s := plistString(val); s != "" {
				return s
			}
		}
	}
	return ""
}
