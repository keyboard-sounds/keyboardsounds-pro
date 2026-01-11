package app

import (
	"path/filepath"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// AppRules is the Wails binding for the application rules UI
type AppRules struct{}

// NewAppRules creates a new AppRules instance
func NewAppRules() *AppRules {
	return &AppRules{}
}

// RuleData represents a rule for the frontend
type RuleData struct {
	AppPath         string  `json:"appPath"`
	ExecutableName  string  `json:"executableName"`
	KeyboardProfile *string `json:"keyboardProfile"`
	MouseProfile    *string `json:"mouseProfile"`
	Enabled         bool    `json:"enabled"`
}

// ListRules returns all application rules
func (a *AppRules) ListRules() ([]RuleData, error) {
	rulesList, err := rules.ListRules()
	if err != nil {
		return nil, err
	}

	result := make([]RuleData, len(rulesList))
	for i, rule := range rulesList {
		result[i] = RuleData{
			AppPath:         rule.AppPath,
			ExecutableName:  filepath.Base(rule.AppPath),
			KeyboardProfile: rule.Profiles.Keyboard,
			MouseProfile:    rule.Profiles.Mouse,
			Enabled:         rule.Enabled,
		}
	}

	return result, nil
}

// UpsertRule creates or updates an application rule
func (a *AppRules) UpsertRule(appPath string, keyboardProfile *string, mouseProfile *string, enabled bool) error {
	rule := rules.Rule{
		AppPath: appPath,
		Profiles: rules.Profiles{
			Keyboard: keyboardProfile,
			Mouse:    mouseProfile,
		},
		Enabled: enabled,
	}

	return rules.UpsertRule(rule)
}

// RemoveRule removes an application rule by its app path
func (a *AppRules) RemoveRule(appPath string) error {
	return rules.RemoveRule(appPath)
}

// ToggleRule toggles the enabled state of a rule
func (a *AppRules) ToggleRule(appPath string) error {
	rulesList, err := rules.ListRules()
	if err != nil {
		return err
	}

	for _, rule := range rulesList {
		if rule.AppPath == appPath {
			rule.Enabled = !rule.Enabled
			return rules.UpsertRule(rule)
		}
	}

	return nil
}

// UpdateRuleProfiles updates the keyboard and/or mouse profile for a rule
func (a *AppRules) UpdateRuleProfiles(appPath string, keyboardProfile *string, mouseProfile *string) error {
	rulesList, err := rules.ListRules()
	if err != nil {
		return err
	}

	for _, rule := range rulesList {
		if rule.AppPath == appPath {
			rule.Profiles.Keyboard = keyboardProfile
			rule.Profiles.Mouse = mouseProfile
			return rules.UpsertRule(rule)
		}
	}

	return nil
}

// BrowseForExecutable opens a file dialog to select an executable file
func (a *AppRules) BrowseForExecutable() (string, error) {
	selection, err := runtime.OpenFileDialog(ctx, runtime.OpenDialogOptions{
		Title: "Select Application",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Executables (*.exe)",
				Pattern:     "*.exe",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})
	if err != nil {
		return "", err
	}

	return selection, nil
}

// GetDefaultProfiles returns the default keyboard and mouse profiles
// This is exposed here as well to keep the API consistent for the rules page
func (a *AppRules) GetDefaultProfiles() rules.Profiles {
	return rules.GetDefaultProfiles()
}

// SetDefaultProfiles sets the default keyboard and mouse profiles
func (a *AppRules) SetDefaultProfiles(keyboard *string, mouse *string) error {
	profiles := rules.Profiles{
		Keyboard: keyboard,
		Mouse:    mouse,
	}
	return mgr.SetDefaultProfiles(profiles)
}

// GetInfoBannerDismissed returns whether the info banner has been dismissed
func (a *AppRules) GetInfoBannerDismissed() bool {
	return GetInfoBannerDismissed()
}

// SetInfoBannerDismissed sets whether the info banner has been dismissed
func (a *AppRules) SetInfoBannerDismissed(dismissed bool) error {
	return SetInfoBannerDismissed(dismissed)
}

// GetNotifyOnMinimize returns whether notifications should be shown when minimized
func (a *AppRules) GetNotifyOnMinimize() bool {
	return GetNotifyOnMinimize()
}

// SetNotifyOnMinimize sets whether notifications should be shown when minimized
func (a *AppRules) SetNotifyOnMinimize(notify bool) error {
	return SetNotifyOnMinimize(notify)
}

// GetNotifyOnUpdate returns whether notifications should be shown when an update is available
func (a *AppRules) GetNotifyOnUpdate() bool {
	return GetNotifyOnUpdate()
}

// SetNotifyOnUpdate sets whether notifications should be shown when an update is available
func (a *AppRules) SetNotifyOnUpdate(notify bool) error {
	return SetNotifyOnUpdate(notify)
}

// GetStartPlayingOnLaunch returns whether sounds should start playing when the app launches
func (a *AppRules) GetStartPlayingOnLaunch() bool {
	return GetStartPlayingOnLaunch()
}

// SetStartPlayingOnLaunch sets whether sounds should start playing when the app launches
func (a *AppRules) SetStartPlayingOnLaunch(startPlaying bool) error {
	return SetStartPlayingOnLaunch(startPlaying)
}

// GetStartHidden returns whether the window should be hidden when launched
func (a *AppRules) GetStartHidden() bool {
	return GetStartHidden()
}

// SetStartHidden sets whether the window should be hidden when launched
func (a *AppRules) SetStartHidden(startHidden bool) error {
	return SetStartHidden(startHidden)
}

// GetInstalledApplications returns a list of installed applications on the system
func (a *AppRules) GetInstalledApplications() []rules.InstalledApplication {
	return rules.GetInstalledApplications()
}

// IsValidGlobPattern checks if a given pattern is a valid glob pattern
func (a *AppRules) IsValidGlobPattern(pattern string) bool {
	return rules.IsValidGlobPattern(pattern)
}
