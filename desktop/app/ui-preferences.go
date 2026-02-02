package app

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/audio"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/manager"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/oskhelpers"
)

type Analytics struct {
	AnalyticsID  uuid.UUID `json:"analyticsID"`
	LastPingTime time.Time `json:"lastPingTime"`
}

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

// OSKHelperPreferences stores persisted OSK Helper settings
type OSKHelperPreferences struct {
	Enabled           bool   `json:"enabled"`
	FontSize          int    `json:"fontSize"`
	FontColor         string `json:"fontColor"`
	BackgroundColor   string `json:"backgroundColor"`
	BackgroundOpacity int    `json:"backgroundOpacity"`
	CornerRadius      int    `json:"cornerRadius"`
	Position          string `json:"position"`
	Offset            int    `json:"offset"`
	DismissAfter      int64  `json:"dismissAfter"` // milliseconds
}

// UIPreferences stores persistent UI state
type UIPreferences struct {
	InfoBannerDismissed      bool                    `json:"infoBannerDismissed"`
	StartPlayingOnLaunch     bool                    `json:"startPlayingOnLaunch"`
	StartHidden              bool                    `json:"startHidden"`
	NotifyOnUpdate           bool                    `json:"notifyOnUpdate"`
	NotifyOnMinimize         bool                    `json:"notifyOnMinimize"`
	AudioEffects             AudioEffectsPreferences `json:"audioEffects"`
	Volume                   VolumePreferences       `json:"volume"`
	OSKHelper                OSKHelperPreferences    `json:"oskHelper"`
	UpdateNotifiedAndIgnored string                  `json:"updateNotifiedAndIgnored"`
	Analytics                Analytics               `json:"analytics"`
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
		OSKHelper: OSKHelperPreferences{
			Enabled:           false,
			FontSize:          24,
			FontColor:         "#FFFFFF",
			BackgroundColor:   "#000000",
			BackgroundOpacity: 200,
			CornerRadius:      12,
			Position:          string(oskhelpers.OSKPositionBottom),
			Offset:            20,
			DismissAfter:      1000,
		},
		Analytics: Analytics{
			AnalyticsID:  uuid.New(),
			LastPingTime: time.Time{}, // Never pinged before
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

func GetUpdateNotifiedAndIgnored() string {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return ""
	}
	return uiPrefs.UpdateNotifiedAndIgnored
}

func SetUpdateNotifiedAndIgnored(updateNotifiedAndIgnored string) error {
	uiPrefsLock.Lock()
	uiPrefs.UpdateNotifiedAndIgnored = updateNotifiedAndIgnored
	uiPrefsLock.Unlock()

	return saveUIPreferences()
}

func UpdateAnalyticsLastPingTime() error {
	uiPrefsLock.Lock()
	uiPrefs.Analytics.LastPingTime = time.Now()
	uiPrefsLock.Unlock()

	return saveUIPreferences()
}

func GetAnalyticsID() string {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return ""
	}
	return uiPrefs.Analytics.AnalyticsID.String()
}

func GetAnalyticsLastPingTimeMS() int64 {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return 0
	}
	return uiPrefs.Analytics.LastPingTime.Unix() * 1000 // Convert to milliseconds
}

// ApplyOSKHelperFromPreferences applies the saved OSK Helper settings to the manager
// This should be called after the manager is initialized
func ApplyOSKHelperFromPreferences() {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()

	if uiPrefs == nil {
		return
	}

	oskPrefs := uiPrefs.OSKHelper

	// Apply OSK Helper settings
	mgr.SetOSKHelperEnabled(oskPrefs.Enabled)
	mgr.SetOSKHelperConfig(oskhelpers.OSKHelperConfig{
		FontSize:          oskPrefs.FontSize,
		FontColor:         oskPrefs.FontColor,
		BackgroundColor:   oskPrefs.BackgroundColor,
		BackgroundOpacity: oskPrefs.BackgroundOpacity,
		CornerRadius:      oskPrefs.CornerRadius,
		Position:          oskhelpers.OSKPosition(oskPrefs.Position),
		Offset:            oskPrefs.Offset,
		DismissAfter:      time.Duration(oskPrefs.DismissAfter) * time.Millisecond,
	})
}

// SaveOSKHelperToPreferences saves the current OSK Helper settings to preferences
func SaveOSKHelperToPreferences() error {
	// Get current state from manager
	enabled := mgr.GetOSKHelperEnabled()
	config := mgr.GetOSKHelperConfig()

	// Update preferences (need write lock for this part)
	uiPrefsLock.Lock()
	uiPrefs.OSKHelper = OSKHelperPreferences{
		Enabled:           enabled,
		FontSize:          config.FontSize,
		FontColor:         config.FontColor,
		BackgroundColor:   config.BackgroundColor,
		BackgroundOpacity: config.BackgroundOpacity,
		CornerRadius:      config.CornerRadius,
		Position:          string(config.Position),
		Offset:            config.Offset,
		DismissAfter:      config.DismissAfter.Milliseconds(),
	}
	uiPrefsLock.Unlock()

	return saveUIPreferences()
}
