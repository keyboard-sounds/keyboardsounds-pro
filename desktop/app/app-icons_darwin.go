//go:build darwin

package app

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/png"
	"os"
	"path/filepath"
	"strings"

	"github.com/jackmordaunt/icns/v3"
	"github.com/nfnt/resize"
	"howett.net/plist"
)

// GetMacOSApplicationIcon returns a small PNG data URL for the icon of a macOS
// application bundle, given an executable path that looks like:
//   /path/to/MyApp.app/Contents/MacOS/MyApp
//
// If the executable path doesn't look like a bundle (or on any failure), it
// returns an empty string.
func (a *AppRules) GetMacOSApplicationIcon(executablePath string) (string, error) {
	bundlePath := macOSBundlePathFromExecutablePath(executablePath)
	if bundlePath == "" {
		return "", nil
	}
	dataURL, err := macOSAppIconDataURL(bundlePath, 64)
	if err != nil {
		// Keep UI resilient: icon fetch should never break the page.
		return "", nil
	}
	return dataURL, nil
}

func macOSBundlePathFromExecutablePath(executablePath string) string {
	if executablePath == "" {
		return ""
	}
	const marker = ".app/Contents/MacOS/"
	idx := strings.LastIndex(executablePath, marker)
	if idx < 0 {
		return ""
	}
	// include ".app"
	return executablePath[:idx+len(".app")]
}

func macOSAppIconDataURL(bundlePath string, size uint) (string, error) {
	iconPath, err := macOSFindBundleIcon(bundlePath)
	if err != nil {
		return "", err
	}

	icnsBytes, err := os.ReadFile(iconPath)
	if err != nil {
		return "", err
	}

	images, err := icns.DecodeAll(bytes.NewReader(icnsBytes))
	if err != nil {
		return "", err
	}
	if len(images) == 0 {
		return "", os.ErrNotExist
	}

	best := pickLargestImage(images)
	if best == nil {
		return "", os.ErrNotExist
	}

	resized := resize.Resize(size, size, best, resize.Lanczos3)

	var out bytes.Buffer
	if err := png.Encode(&out, resized); err != nil {
		return "", err
	}

	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(out.Bytes()), nil
}

func pickLargestImage(imgs []image.Image) image.Image {
	var (
		best image.Image
		area int
	)
	for _, img := range imgs {
		if img == nil {
			continue
		}
		b := img.Bounds()
		a := b.Dx() * b.Dy()
		if best == nil || a > area {
			best = img
			area = a
		}
	}
	return best
}

func macOSFindBundleIcon(bundlePath string) (string, error) {
	plistPath := filepath.Join(bundlePath, "Contents", "Info.plist")
	data, err := os.ReadFile(plistPath)
	if err != nil {
		return "", err
	}

	var raw map[string]interface{}
	if _, err := plist.Unmarshal(data, &raw); err != nil {
		return "", err
	}

	iconName := plistString(raw["CFBundleIconFile"])
	if iconName == "" {
		iconName = plistString(raw["CFBundleIconName"])
	}
	if iconName == "" {
		// CFBundleIcons -> CFBundlePrimaryIcon -> CFBundleIconFiles
		if icons, ok := raw["CFBundleIcons"].(map[string]interface{}); ok {
			if primary, ok := icons["CFBundlePrimaryIcon"].(map[string]interface{}); ok {
				if files, ok := primary["CFBundleIconFiles"].([]interface{}); ok {
					for i := len(files) - 1; i >= 0; i-- {
						if s := plistString(files[i]); s != "" {
							iconName = s
							break
						}
					}
				}
			}
		}
	}

	if iconName == "" {
		return "", os.ErrNotExist
	}

	if !strings.HasSuffix(strings.ToLower(iconName), ".icns") {
		iconName += ".icns"
	}

	iconPath := filepath.Join(bundlePath, "Contents", "Resources", iconName)
	if st, err := os.Stat(iconPath); err == nil && !st.IsDir() {
		return iconPath, nil
	}

	// Some bundles omit the extension in Info.plist but have the file with extension, or vice-versa.
	alt := strings.TrimSuffix(iconName, ".icns")
	if alt != iconName {
		altPath := filepath.Join(bundlePath, "Contents", "Resources", alt)
		if st, err := os.Stat(altPath); err == nil && !st.IsDir() {
			return altPath, nil
		}
	}

	return "", os.ErrNotExist
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

