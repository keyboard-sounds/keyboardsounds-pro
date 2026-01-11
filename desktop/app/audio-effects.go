package app

import (
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/audio"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/manager"
)

// AudioEffects is the Wails binding for audio effects settings
type AudioEffects struct{}

// NewAudioEffects creates a new AudioEffects instance
func NewAudioEffects() *AudioEffects {
	return &AudioEffects{}
}

// PitchShiftState represents the current pitch shift settings
type PitchShiftState struct {
	Enabled bool    `json:"enabled"`
	Lower   float64 `json:"lower"`
	Upper   float64 `json:"upper"`
}

// PanState represents the current pan settings for keyboard
type PanState struct {
	Enabled bool   `json:"enabled"`
	PanType string `json:"panType"`
	MaxX    int    `json:"maxX"`
}

// MousePanState represents the current pan settings for mouse (simpler, just enabled)
type MousePanState struct {
	Enabled bool `json:"enabled"`
}

// EqualizerState represents the current equalizer settings
type EqualizerState struct {
	Enabled bool                  `json:"enabled"`
	Config  audio.EqualizerConfig `json:"config"`
}

// AudioEffectsState represents the complete audio effects state
type AudioEffectsState struct {
	// Keyboard
	KeyboardPitchShift PitchShiftState `json:"keyboardPitchShift"`
	KeyboardPan        PanState        `json:"keyboardPan"`
	KeyboardEqualizer  EqualizerState  `json:"keyboardEqualizer"`
	// Mouse
	MousePitchShift PitchShiftState `json:"mousePitchShift"`
	MousePan        MousePanState   `json:"mousePan"`
	MouseEqualizer  EqualizerState  `json:"mouseEqualizer"`
}

// GetState returns the complete audio effects state
func (a *AudioEffects) GetState() AudioEffectsState {
	// Keyboard pitch shift
	kbPitchEnabled, kbPitchLower, kbPitchUpper := mgr.GetKeyboardAudioPitchShift()

	// Keyboard pan
	kbPanEnabled, kbPanType, kbPanMaxX := mgr.GetKeyboardAudioPan()

	// Keyboard equalizer
	kbEqEnabled, kbEqConfig := mgr.GetKeyboardAudioEqualizer()
	if kbEqConfig == nil {
		kbEqConfig = &audio.EqualizerConfig{}
	}

	// Mouse pitch shift
	msPitchEnabled, msPitchLower, msPitchUpper := mgr.GetMouseAudioPitchShift()

	// Mouse pan
	msPanEnabled := mgr.GetMouseAudioPan()

	// Mouse equalizer
	msEqEnabled, msEqConfig := mgr.GetMouseAudioEqualizer()
	if msEqConfig == nil {
		msEqConfig = &audio.EqualizerConfig{}
	}

	return AudioEffectsState{
		KeyboardPitchShift: PitchShiftState{
			Enabled: kbPitchEnabled,
			Lower:   kbPitchLower,
			Upper:   kbPitchUpper,
		},
		KeyboardPan: PanState{
			Enabled: kbPanEnabled,
			PanType: string(kbPanType),
			MaxX:    kbPanMaxX,
		},
		KeyboardEqualizer: EqualizerState{
			Enabled: kbEqEnabled,
			Config:  *kbEqConfig,
		},
		MousePitchShift: PitchShiftState{
			Enabled: msPitchEnabled,
			Lower:   msPitchLower,
			Upper:   msPitchUpper,
		},
		MousePan: MousePanState{
			Enabled: msPanEnabled,
		},
		MouseEqualizer: EqualizerState{
			Enabled: msEqEnabled,
			Config:  *msEqConfig,
		},
	}
}

// SetKeyboardPitchShift sets the keyboard pitch shift settings
func (a *AudioEffects) SetKeyboardPitchShift(enabled bool, lower, upper float64) error {
	mgr.SetKeyboardAudioPitchShift(enabled, lower, upper)
	return SaveAudioEffectsToPreferences()
}

// SetKeyboardPan sets the keyboard pan settings
func (a *AudioEffects) SetKeyboardPan(enabled bool, panType string, maxX int) error {
	mgr.SetKeyboardAudioPan(enabled, manager.PanType(panType), maxX)
	return SaveAudioEffectsToPreferences()
}

// SetKeyboardEqualizer sets the keyboard equalizer settings
func (a *AudioEffects) SetKeyboardEqualizer(enabled bool, config audio.EqualizerConfig) error {
	mgr.SetKeyboardAudioEqualizer(enabled, config)
	return SaveAudioEffectsToPreferences()
}

// SetMousePitchShift sets the mouse pitch shift settings
func (a *AudioEffects) SetMousePitchShift(enabled bool, lower, upper float64) error {
	mgr.SetMouseAudioPitchShift(enabled, lower, upper)
	return SaveAudioEffectsToPreferences()
}

// SetMousePan sets the mouse pan settings (mouse only has enabled/disabled, always random mode)
func (a *AudioEffects) SetMousePan(enabled bool) error {
	mgr.SetMouseAudioPan(enabled)
	return SaveAudioEffectsToPreferences()
}

// SetMouseEqualizer sets the mouse equalizer settings
func (a *AudioEffects) SetMouseEqualizer(enabled bool, config audio.EqualizerConfig) error {
	mgr.SetMouseAudioEqualizer(enabled, config)
	return SaveAudioEffectsToPreferences()
}
