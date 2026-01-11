package app

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/audio"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/manager"
)

// AudioEffectsPreferences stores persisted audio effects settings
type AudioEffectsPreferences struct {
	// Keyboard
	KeyboardPitchShift PitchShiftState `json:"keyboardPitchShift"`
	KeyboardPan        PanState        `json:"keyboardPan"`
	KeyboardEqualizer  EqualizerState  `json:"keyboardEqualizer"`
	// Mouse
	MousePitchShift PitchShiftState `json:"mousePitchShift"`
	MousePan        MousePanState   `json:"mousePan"`
	MouseEqualizer  EqualizerState  `json:"mouseEqualizer"`
}

// VolumePreferences stores persisted volume settings
type VolumePreferences struct {
	KeyboardVolume float64 `json:"keyboardVolume"`
	MouseVolume    float64 `json:"mouseVolume"`
}

// UIPreferences stores persistent UI state
type UIPreferences struct {
	InfoBannerDismissed  bool                    `json:"infoBannerDismissed"`
	StartPlayingOnLaunch bool                    `json:"startPlayingOnLaunch"`
	StartHidden          bool                    `json:"startHidden"`
	NotifyOnUpdate       bool                    `json:"notifyOnUpdate"`
	NotifyOnMinimize     bool                    `json:"notifyOnMinimize"`
	AudioEffects         AudioEffectsPreferences `json:"audioEffects"`
	Volume               VolumePreferences       `json:"volume"`
}

var (
	uiPrefs     *UIPreferences
	uiPrefsLock sync.RWMutex
	uiPrefsPath string
)

func init() {
	uiPrefsPath = filepath.Join(kbs.GetHomeDirectory(), "ui-preferences.json")
	loadUIPreferences()
}

func loadUIPreferences() {
	uiPrefsLock.Lock()
	defer uiPrefsLock.Unlock()

	// Initialize with defaults
	uiPrefs = &UIPreferences{
		InfoBannerDismissed:  false,
		StartPlayingOnLaunch: false,
		StartHidden:          false,
		NotifyOnUpdate:       true,
		NotifyOnMinimize:     true,
		AudioEffects: AudioEffectsPreferences{
			KeyboardPitchShift: PitchShiftState{Enabled: false, Lower: -3, Upper: 3},
			KeyboardPan:        PanState{Enabled: false, PanType: "key-position", MaxX: 14},
			KeyboardEqualizer:  EqualizerState{Enabled: false, Config: audio.EqualizerConfig{}},
			MousePitchShift:    PitchShiftState{Enabled: false, Lower: -3, Upper: 3},
			MousePan:           MousePanState{Enabled: false},
			MouseEqualizer:     EqualizerState{Enabled: false, Config: audio.EqualizerConfig{}},
		},
		Volume: VolumePreferences{
			KeyboardVolume: 1.0,
			MouseVolume:    1.0,
		},
	}

	data, err := os.ReadFile(uiPrefsPath)
	if err != nil {
		return // File doesn't exist yet, use defaults
	}

	json.Unmarshal(data, uiPrefs)
}

func saveUIPreferences() error {
	uiPrefsLock.Lock()
	defer uiPrefsLock.Unlock()

	// Ensure directory exists
	dir := filepath.Dir(uiPrefsPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(uiPrefs, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(uiPrefsPath, data, 0644)
}

// ApplyAudioEffectsFromPreferences applies the saved audio effects to the manager
// This should be called after the manager is initialized
func ApplyAudioEffectsFromPreferences() {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return
	}

	effects := uiPrefs.AudioEffects

	// Apply keyboard settings
	mgr.SetKeyboardAudioPitchShift(effects.KeyboardPitchShift.Enabled, effects.KeyboardPitchShift.Lower, effects.KeyboardPitchShift.Upper)
	mgr.SetKeyboardAudioPan(effects.KeyboardPan.Enabled, manager.PanType(effects.KeyboardPan.PanType), effects.KeyboardPan.MaxX)
	mgr.SetKeyboardAudioEqualizer(effects.KeyboardEqualizer.Enabled, effects.KeyboardEqualizer.Config)

	// Apply mouse settings
	mgr.SetMouseAudioPitchShift(effects.MousePitchShift.Enabled, effects.MousePitchShift.Lower, effects.MousePitchShift.Upper)
	mgr.SetMouseAudioPan(effects.MousePan.Enabled)
	mgr.SetMouseAudioEqualizer(effects.MouseEqualizer.Enabled, effects.MouseEqualizer.Config)
}

// ApplyVolumeFromPreferences applies the saved volume settings to the manager
// This should be called after the manager is initialized
func ApplyVolumeFromPreferences() {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return
	}

	volume := uiPrefs.Volume

	// Apply volume settings
	mgr.SetKeyboardVolume(volume.KeyboardVolume)
	mgr.SetMouseVolume(volume.MouseVolume)
}

// SaveVolumeToPreferences saves the current volume settings to preferences
func SaveVolumeToPreferences() error {
	// Get current state from manager
	keyboardVolume := mgr.GetKeyboardVolume()
	mouseVolume := mgr.GetMouseVolume()

	// Update preferences (need write lock for this part)
	uiPrefsLock.Lock()
	uiPrefs.Volume = VolumePreferences{
		KeyboardVolume: keyboardVolume,
		MouseVolume:    mouseVolume,
	}
	uiPrefsLock.Unlock()

	return saveUIPreferences()
}

// SaveAudioEffectsToPreferences saves the current audio effects state to preferences
func SaveAudioEffectsToPreferences() error {
	// Get current state from manager
	kbPitchEnabled, kbPitchLower, kbPitchUpper := mgr.GetKeyboardAudioPitchShift()
	kbPanEnabled, kbPanType, kbPanMaxX := mgr.GetKeyboardAudioPan()
	kbEqEnabled, kbEqConfig := mgr.GetKeyboardAudioEqualizer()
	if kbEqConfig == nil {
		kbEqConfig = &audio.EqualizerConfig{}
	}

	msPitchEnabled, msPitchLower, msPitchUpper := mgr.GetMouseAudioPitchShift()
	msPanEnabled := mgr.GetMouseAudioPan()
	msEqEnabled, msEqConfig := mgr.GetMouseAudioEqualizer()
	if msEqConfig == nil {
		msEqConfig = &audio.EqualizerConfig{}
	}

	// Update preferences (need write lock for this part)
	uiPrefsLock.Lock()
	uiPrefs.AudioEffects = AudioEffectsPreferences{
		KeyboardPitchShift: PitchShiftState{Enabled: kbPitchEnabled, Lower: kbPitchLower, Upper: kbPitchUpper},
		KeyboardPan:        PanState{Enabled: kbPanEnabled, PanType: string(kbPanType), MaxX: kbPanMaxX},
		KeyboardEqualizer:  EqualizerState{Enabled: kbEqEnabled, Config: *kbEqConfig},
		MousePitchShift:    PitchShiftState{Enabled: msPitchEnabled, Lower: msPitchLower, Upper: msPitchUpper},
		MousePan:           MousePanState{Enabled: msPanEnabled},
		MouseEqualizer:     EqualizerState{Enabled: msEqEnabled, Config: *msEqConfig},
	}
	uiPrefsLock.Unlock()

	return saveUIPreferences()
}

// GetInfoBannerDismissed returns whether the info banner has been dismissed
func GetInfoBannerDismissed() bool {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return false
	}
	return uiPrefs.InfoBannerDismissed
}

// SetInfoBannerDismissed sets whether the info banner has been dismissed
func SetInfoBannerDismissed(dismissed bool) error {
	uiPrefsLock.Lock()
	uiPrefs.InfoBannerDismissed = dismissed
	uiPrefsLock.Unlock()

	return saveUIPreferences()
}

// GetNotifyOnMinimize returns whether notifications should be shown when minimized
func GetNotifyOnMinimize() bool {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return true
	}
	return uiPrefs.NotifyOnMinimize
}

// SetNotifyOnMinimize sets whether notifications should be shown when minimized
func SetNotifyOnMinimize(notify bool) error {
	uiPrefsLock.Lock()
	uiPrefs.NotifyOnMinimize = notify
	uiPrefsLock.Unlock()

	return saveUIPreferences()
}

// GetNotifyOnUpdate returns whether notifications should be shown when an update is available
func GetNotifyOnUpdate() bool {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return true
	}
	return uiPrefs.NotifyOnUpdate
}

// SetNotifyOnUpdate sets whether notifications should be shown when an update is available
func SetNotifyOnUpdate(notify bool) error {
	uiPrefsLock.Lock()
	uiPrefs.NotifyOnUpdate = notify
	uiPrefsLock.Unlock()

	return saveUIPreferences()
}

// GetStartPlayingOnLaunch returns whether sounds should start playing when the app launches
func GetStartPlayingOnLaunch() bool {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return false
	}
	return uiPrefs.StartPlayingOnLaunch
}

// SetStartPlayingOnLaunch sets whether sounds should start playing when the app launches
func SetStartPlayingOnLaunch(startPlaying bool) error {
	uiPrefsLock.Lock()
	uiPrefs.StartPlayingOnLaunch = startPlaying
	uiPrefsLock.Unlock()

	return saveUIPreferences()
}

// GetStartHidden returns whether the window should be hidden when launched
func GetStartHidden() bool {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return false
	}
	return uiPrefs.StartHidden
}

// SetStartHidden sets whether the window should be hidden when launched
func SetStartHidden(startHidden bool) error {
	uiPrefsLock.Lock()
	uiPrefs.StartHidden = startHidden
	uiPrefsLock.Unlock()

	return saveUIPreferences()
}
