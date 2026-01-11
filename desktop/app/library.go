package app

import (
	"fmt"
	"os/exec"
	goRuntime "runtime"
	"strings"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/profile"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Library is the Wails binding for the library UI
type Library struct{}

// NewLibrary creates a new Library instance
func NewLibrary() *Library {
	return &Library{}
}

// ProfileData represents a profile for the frontend
type ProfileData struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Author      string `json:"author"`
	Type        string `json:"type"`
	InUse       bool   `json:"inUse"`
	InUseReason string `json:"inUseReason"`
}

// LibraryState represents the state of the library page
type LibraryState struct {
	KeyboardProfiles []ProfileData `json:"keyboardProfiles"`
	MouseProfiles    []ProfileData `json:"mouseProfiles"`
}

// GetState returns the current state of the library
func (l *Library) GetState() LibraryState {
	keyboardProfiles := make([]ProfileData, 0)
	for _, p := range profile.GetKeyboardProfiles() {
		inUse, reason := l.checkProfileInUse(p.Details.Name, "keyboard")
		keyboardProfiles = append(keyboardProfiles, ProfileData{
			ID:          p.Details.Name,
			Name:        p.Details.Name,
			Description: p.Details.Description,
			Author:      p.Details.Author,
			Type:        "keyboard",
			InUse:       inUse,
			InUseReason: reason,
		})
	}

	mouseProfiles := make([]ProfileData, 0)
	for _, p := range profile.GetMouseProfiles() {
		inUse, reason := l.checkProfileInUse(p.Details.Name, "mouse")
		mouseProfiles = append(mouseProfiles, ProfileData{
			ID:          p.Details.Name,
			Name:        p.Details.Name,
			Description: p.Details.Description,
			Author:      p.Details.Author,
			Type:        "mouse",
			InUse:       inUse,
			InUseReason: reason,
		})
	}

	return LibraryState{
		KeyboardProfiles: keyboardProfiles,
		MouseProfiles:    mouseProfiles,
	}
}

// checkProfileInUse checks if a profile is currently in use by default profiles or app rules
func (l *Library) checkProfileInUse(profileName string, profileType string) (bool, string) {
	reasons := make([]string, 0)

	// Check if it's the default profile
	defaultProfiles := rules.GetDefaultProfiles()
	if profileType == "keyboard" && defaultProfiles.Keyboard != nil && strings.EqualFold(*defaultProfiles.Keyboard, profileName) {
		reasons = append(reasons, "default keyboard profile")
	}
	if profileType == "mouse" && defaultProfiles.Mouse != nil && strings.EqualFold(*defaultProfiles.Mouse, profileName) {
		reasons = append(reasons, "default mouse profile")
	}

	// Check if it's used by any app rules
	rulesList, err := rules.ListRules()
	if err == nil {
		for _, rule := range rulesList {
			if profileType == "keyboard" && rule.Profiles.Keyboard != nil && strings.EqualFold(*rule.Profiles.Keyboard, profileName) {
				reasons = append(reasons, "application rule")
				break
			}
			if profileType == "mouse" && rule.Profiles.Mouse != nil && strings.EqualFold(*rule.Profiles.Mouse, profileName) {
				reasons = append(reasons, "application rule")
				break
			}
		}
	}

	if len(reasons) == 0 {
		return false, ""
	}

	return true, "Used by: " + strings.Join(reasons, ", ")
}

// DeleteProfile deletes a profile by name
func (l *Library) DeleteProfile(name string) error {
	// First check if the profile exists and get its type
	keyboardProfile, foundKeyboard := findKeyboardProfile(name)
	mouseProfile, foundMouse := findMouseProfile(name)

	if !foundKeyboard && !foundMouse {
		return fmt.Errorf("profile not found")
	}

	profileType := "keyboard"
	if foundMouse {
		profileType = "mouse"
		_ = mouseProfile
	} else {
		_ = keyboardProfile
	}

	// Check if it's in use
	inUse, reason := l.checkProfileInUse(name, profileType)
	if inUse {
		return fmt.Errorf("cannot delete profile: %s", reason)
	}

	return profile.DeleteProfile(name)
}

func findKeyboardProfile(name string) (*profile.Profile, bool) {
	for _, p := range profile.GetKeyboardProfiles() {
		if strings.EqualFold(p.Details.Name, name) {
			return p, true
		}
	}
	return nil, false
}

func findMouseProfile(name string) (*profile.Profile, bool) {
	for _, p := range profile.GetMouseProfiles() {
		if strings.EqualFold(p.Details.Name, name) {
			return p, true
		}
	}
	return nil, false
}

// OpenProfileFolder opens the profile folder in the system file explorer
func (l *Library) OpenProfileFolder(name string) error {
	// Find the profile
	p, found := findKeyboardProfile(name)
	if !found {
		p, found = findMouseProfile(name)
	}
	if !found {
		return fmt.Errorf("profile not found")
	}

	// Open the folder in the file explorer
	var cmd *exec.Cmd
	switch goRuntime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", p.Location)
	case "darwin":
		cmd = exec.Command("open", p.Location)
	case "linux":
		cmd = exec.Command("xdg-open", p.Location)
	default:
		return fmt.Errorf("unsupported operating system")
	}

	return cmd.Start()
}

// ImportProfile opens a file dialog to select a zip file and imports the profile
func (l *Library) ImportProfile() error {
	selection, err := runtime.OpenFileDialog(ctx, runtime.OpenDialogOptions{
		Title: "Import Profile",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Profile Archives (*.zip)",
				Pattern:     "*.zip",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to open file dialog: %w", err)
	}

	if selection == "" {
		// User cancelled the dialog
		return nil
	}

	// Import the profile
	err = profile.ImportProfile(selection)
	if err != nil {
		return fmt.Errorf("failed to import profile: %w", err)
	}

	return nil
}

// ExportProfile opens a save dialog to select where to save the zip file and exports the profile
func (l *Library) ExportProfile(name string) error {
	// Find the profile to get its name for the default filename
	p, found := findKeyboardProfile(name)
	if !found {
		p, found = findMouseProfile(name)
	}
	if !found {
		return fmt.Errorf("profile not found")
	}

	// Open save file dialog
	selection, err := runtime.SaveFileDialog(ctx, runtime.SaveDialogOptions{
		Title:           "Export Profile",
		DefaultFilename: p.Details.Name + ".zip",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Profile Archives (*.zip)",
				Pattern:     "*.zip",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to open save dialog: %w", err)
	}

	if selection == "" {
		// User cancelled the dialog
		return nil
	}

	// Export the profile
	err = profile.ExportProfile(name, selection)
	if err != nil {
		return fmt.Errorf("failed to export profile: %w", err)
	}

	return nil
}
