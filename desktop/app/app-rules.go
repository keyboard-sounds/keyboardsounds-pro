package app

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	kbsapp "github.com/keyboard-sounds/keyboardsounds-pro/backend/app"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	gort "runtime"
)

// AppRules is the Wails binding for the application rules UI
type AppRules struct{}

// InAppFocusProfileSettings is returned to the frontend for Settings → Application Settings.
type InAppFocusProfileSettings struct {
	KeyboardProfile *string `json:"keyboardProfile"`
	MouseProfile    *string `json:"mouseProfile"`
}

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

	return fmt.Errorf("application rule not found for path: %s", appPath)
}

// BrowseForExecutable opens a file dialog to select an executable file
func (a *AppRules) BrowseForExecutable() (string, error) {
	var filters []runtime.FileFilter

	switch gort.GOOS {
	case "darwin":
		filters = []runtime.FileFilter{}
	case "windows":
		filters = []runtime.FileFilter{
			{
				DisplayName: "Executables (*.exe)",
				Pattern:     "*.exe",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*",
			},
		}
	default:
		filters = []runtime.FileFilter{
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		}
	}

	selection, err := runtime.OpenFileDialog(ctx, runtime.OpenDialogOptions{
		Title:   "Select Application",
		Filters: filters,
	})
	if err != nil {
		return "", err
	}

	if gort.GOOS == "darwin" {
		// Check if the path is an app bundle, and if so find the executable binary for it
		// If it is an app bundle, the executable binary is located in the Contents/MacOS directory
		if strings.HasSuffix(selection, ".app") {
			executablePath := filepath.Join(selection, "Contents", "MacOS", strings.TrimSuffix(filepath.Base(selection), ".app"))
			slog.Info("executablePath", "path", executablePath)
			if _, err := os.Stat(executablePath); err == nil {
				selection = executablePath
			}
		}
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
	return kbsApp.SetDefaultProfiles(profiles)
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

// GetSystemTrayEnabled returns whether the system tray icon is enabled
func (a *AppRules) GetSystemTrayEnabled() bool {
	return GetSystemTrayEnabled()
}

// SetSystemTrayEnabled sets whether the system tray icon is enabled. When disabled, closing the window quits the application.
func (a *AppRules) SetSystemTrayEnabled(enabled bool) error {
	return SetSystemTrayEnabled(enabled)
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

// GetPlayEnabledSoundOnStart returns whether to play the enabled sound when starting playback.
func (a *AppRules) GetPlayEnabledSoundOnStart() bool {
	return GetPlayEnabledSoundOnStart()
}

// SetPlayEnabledSoundOnStart sets whether to play the enabled sound when starting playback.
func (a *AppRules) SetPlayEnabledSoundOnStart(enabled bool) error {
	return SetPlayEnabledSoundOnStart(enabled)
}

// GetStartHidden returns whether the window should be hidden when launched
func (a *AppRules) GetStartHidden() bool {
	return GetStartHidden()
}

// SetStartHidden sets whether the window should be hidden when launched
func (a *AppRules) SetStartHidden(startHidden bool) error {
	return SetStartHidden(startHidden)
}

// GetCustomTitleBarEnabled returns whether the custom title bar is enabled
func (a *AppRules) GetCustomTitleBarEnabled() bool {
	return GetCustomTitleBarEnabled()
}

// SetCustomTitleBarEnabled sets whether the custom title bar is enabled. A restart is required for the change to take effect.
func (a *AppRules) SetCustomTitleBarEnabled(enabled bool) error {
	return SetCustomTitleBarEnabled(enabled)
}

// GetHideStatusBoxDefaultProfile returns whether the default profile section should be hidden in the status box
func (a *AppRules) GetHideStatusBoxDefaultProfile() bool {
	return GetHideStatusBoxDefaultProfile()
}

// SetHideStatusBoxDefaultProfile sets whether the default profile section should be hidden in the status box. Default profiles remain accessible from Application Rules.
func (a *AppRules) SetHideStatusBoxDefaultProfile(hide bool) error {
	return SetHideStatusBoxDefaultProfile(hide)
}

// GetInstalledApplications returns a list of installed applications on the system
func (a *AppRules) GetInstalledApplications() []rules.InstalledApplication {
	return rules.GetInstalledApplications()
}

// IsValidGlobPattern checks if a given pattern is a valid glob pattern
func (a *AppRules) IsValidGlobPattern(pattern string) bool {
	return rules.IsValidGlobPattern(pattern)
}

// GetApplicationRulesHeroContext returns the focused or last-focused app and resolved profiles for the Application Rules hero.
func (a *AppRules) GetApplicationRulesHeroContext() kbsapp.ApplicationRulesHeroContext {
	if kbsApp == nil {
		return kbsapp.ApplicationRulesHeroContext{Supported: false}
	}
	return kbsApp.GetApplicationRulesHeroContext()
}

// GetInAppFocusProfiles returns persisted in-app (self-focused) profile overrides.
func (a *AppRules) GetInAppFocusProfiles() InAppFocusProfileSettings {
	return InAppFocusProfileSettings{
		KeyboardProfile: GetInAppKeyboardProfile(),
		MouseProfile:    GetInAppMouseProfile(),
	}
}

// SetInAppKeyboardProfile sets the keyboard profile when this app is focused (nil = use default rules).
func (a *AppRules) SetInAppKeyboardProfile(name *string) error {
	return SetInAppKeyboardProfile(name)
}

// SetInAppMouseProfile sets the mouse profile when this app is focused (nil = use default rules).
func (a *AppRules) SetInAppMouseProfile(name *string) error {
	return SetInAppMouseProfile(name)
}
