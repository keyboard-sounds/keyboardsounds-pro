package app

import (
	"log/slog"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/profile"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
)

// StatusPanel is the Wails binding for the status panel UI
type StatusPanel struct{}

// NewStatusPanel creates a new StatusPanel instance
func NewStatusPanel() *StatusPanel {
	return &StatusPanel{}
}

// StatusPanelState represents the current state of the status panel
type StatusPanelState struct {
	Enabled          bool     `json:"enabled"`
	KeyboardVolume   float64  `json:"keyboardVolume"`
	MouseVolume      float64  `json:"mouseVolume"`
	KeyboardProfile  *string  `json:"keyboardProfile"`
	MouseProfile     *string  `json:"mouseProfile"`
	KeyboardProfiles []string `json:"keyboardProfiles"`
	MouseProfiles    []string `json:"mouseProfiles"`
}

// GetState returns the current state of the status panel
func (s *StatusPanel) GetState() StatusPanelState {
	defaultProfiles := rules.GetDefaultProfiles()

	keyboardProfiles := make([]string, 0)
	for _, p := range profile.GetKeyboardProfiles() {
		keyboardProfiles = append(keyboardProfiles, p.Details.Name)
	}

	mouseProfiles := make([]string, 0)
	for _, p := range profile.GetMouseProfiles() {
		mouseProfiles = append(mouseProfiles, p.Details.Name)
	}

	return StatusPanelState{
		Enabled:          mgr.IsEnabled(),
		KeyboardVolume:   mgr.GetKeyboardVolume(),
		MouseVolume:      mgr.GetMouseVolume(),
		KeyboardProfile:  defaultProfiles.Keyboard,
		MouseProfile:     defaultProfiles.Mouse,
		KeyboardProfiles: keyboardProfiles,
		MouseProfiles:    mouseProfiles,
	}
}

// Enable enables the keyboard sounds manager
func (s *StatusPanel) Enable() error {
	return mgr.Enable()
}

// Disable disables the keyboard sounds manager
func (s *StatusPanel) Disable() error {
	return mgr.Disable()
}

// IsEnabled returns whether the manager is currently enabled
func (s *StatusPanel) IsEnabled() bool {
	return mgr.IsEnabled()
}

// SetKeyboardVolume sets the keyboard volume (0.0 to 1.0)
func (s *StatusPanel) SetKeyboardVolume(volume float64) error {
	err := mgr.SetKeyboardVolume(volume)
	if err != nil {
		return err
	}
	return SaveVolumeToPreferences()
}

// GetKeyboardVolume returns the current keyboard volume
func (s *StatusPanel) GetKeyboardVolume() float64 {
	return mgr.GetKeyboardVolume()
}

// SetMouseVolume sets the mouse volume (0.0 to 1.0)
func (s *StatusPanel) SetMouseVolume(volume float64) error {
	err := mgr.SetMouseVolume(volume)
	if err != nil {
		return err
	}
	return SaveVolumeToPreferences()
}

// GetMouseVolume returns the current mouse volume
func (s *StatusPanel) GetMouseVolume() float64 {
	return mgr.GetMouseVolume()
}

// GetDefaultProfiles returns the default keyboard and mouse profiles
func (s *StatusPanel) GetDefaultProfiles() rules.Profiles {
	profiles := rules.GetDefaultProfiles()
	slog.Info("default profiles", "keyboard", profiles.Keyboard, "mouse", profiles.Mouse)
	return profiles
}

// SetDefaultProfiles sets the default keyboard and mouse profiles
func (s *StatusPanel) SetDefaultProfiles(keyboard *string, mouse *string) error {
	profiles := rules.Profiles{
		Keyboard: keyboard,
		Mouse:    mouse,
	}
	return mgr.SetDefaultProfiles(profiles)
}

// SetDefaultKeyboardProfile sets the default keyboard profile by name
func (s *StatusPanel) SetDefaultKeyboardProfile(name string) error {
	current := rules.GetDefaultProfiles()
	current.Keyboard = &name
	return mgr.SetDefaultProfiles(current)
}

// ClearDefaultKeyboardProfile clears the default keyboard profile (sets to nil)
func (s *StatusPanel) ClearDefaultKeyboardProfile() error {
	current := rules.GetDefaultProfiles()
	current.Keyboard = nil
	return mgr.SetDefaultProfiles(current)
}

// SetDefaultMouseProfile sets the default mouse profile by name
func (s *StatusPanel) SetDefaultMouseProfile(name string) error {
	current := rules.GetDefaultProfiles()
	current.Mouse = &name
	return mgr.SetDefaultProfiles(current)
}

// ClearDefaultMouseProfile clears the default mouse profile (sets to nil)
func (s *StatusPanel) ClearDefaultMouseProfile() error {
	current := rules.GetDefaultProfiles()
	current.Mouse = nil
	return mgr.SetDefaultProfiles(current)
}

// GetKeyboardProfiles returns a list of available keyboard profile names
func (s *StatusPanel) GetKeyboardProfiles() []string {
	profiles := profile.GetKeyboardProfiles()
	names := make([]string, len(profiles))
	for i, p := range profiles {
		names[i] = p.Details.Name
	}
	return names
}

// GetMouseProfiles returns a list of available mouse profile names
func (s *StatusPanel) GetMouseProfiles() []string {
	profiles := profile.GetMouseProfiles()
	names := make([]string, len(profiles))
	for i, p := range profiles {
		names[i] = p.Details.Name
	}
	return names
}

// MuteKeyboard mutes the keyboard audio player
func (s *StatusPanel) MuteKeyboard() error {
	mgr.MuteKeyboard()
	return SaveVolumeToPreferences()
}

// UnmuteKeyboard unmutes the keyboard audio player
func (s *StatusPanel) UnmuteKeyboard() error {
	mgr.UnmuteKeyboard()
	return SaveVolumeToPreferences()
}

// ToggleMuteKeyboard toggles the mute state of the keyboard audio player
func (s *StatusPanel) ToggleMuteKeyboard() error {
	mgr.ToggleMuteKeyboard()
	return SaveVolumeToPreferences()
}

// MuteMouse mutes the mouse audio player
func (s *StatusPanel) MuteMouse() error {
	mgr.MuteMouse()
	return SaveVolumeToPreferences()
}

// UnmuteMouse unmutes the mouse audio player
func (s *StatusPanel) UnmuteMouse() error {
	mgr.UnmuteMouse()
	return SaveVolumeToPreferences()
}

// ToggleMuteMouse toggles the mute state of the mouse audio player
func (s *StatusPanel) ToggleMuteMouse() error {
	mgr.ToggleMuteMouse()
	return SaveVolumeToPreferences()
}
