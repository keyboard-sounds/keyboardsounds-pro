package app

import (
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/audio"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/app"
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
	kbPitchEnabled, kbPitchLower, kbPitchUpper := kbsApp.GetKeyboardAudioPitchShift()

	// Keyboard pan
	kbPanEnabled, kbPanType, kbPanMaxX := kbsApp.GetKeyboardAudioPan()

	// Keyboard equalizer
	kbEqEnabled, kbEqConfig := kbsApp.GetKeyboardAudioEqualizer()
	if kbEqConfig == nil {
		kbEqConfig = &audio.EqualizerConfig{}
	}

	// Mouse pitch shift
	msPitchEnabled, msPitchLower, msPitchUpper := kbsApp.GetMouseAudioPitchShift()

	// Mouse pan
	msPanEnabled := kbsApp.GetMouseAudioPan()

	// Mouse equalizer
	msEqEnabled, msEqConfig := kbsApp.GetMouseAudioEqualizer()
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
	kbsApp.SetKeyboardAudioPitchShift(enabled, lower, upper)
	return SaveAudioEffectsToPreferences()
}

// SetKeyboardPan sets the keyboard pan settings
func (a *AudioEffects) SetKeyboardPan(enabled bool, panType string, maxX int) error {
	kbsApp.SetKeyboardAudioPan(enabled, app.PanType(panType), maxX)
	return SaveAudioEffectsToPreferences()
}

// SetKeyboardEqualizer sets the keyboard equalizer settings
func (a *AudioEffects) SetKeyboardEqualizer(enabled bool, config audio.EqualizerConfig) error {
	kbsApp.SetKeyboardAudioEqualizer(enabled, config)
	return SaveAudioEffectsToPreferences()
}

// SetMousePitchShift sets the mouse pitch shift settings
func (a *AudioEffects) SetMousePitchShift(enabled bool, lower, upper float64) error {
	kbsApp.SetMouseAudioPitchShift(enabled, lower, upper)
	return SaveAudioEffectsToPreferences()
}

// SetMousePan sets the mouse pan settings (mouse only has enabled/disabled, always random mode)
func (a *AudioEffects) SetMousePan(enabled bool) error {
	kbsApp.SetMouseAudioPan(enabled)
	return SaveAudioEffectsToPreferences()
}

// SetMouseEqualizer sets the mouse equalizer settings
func (a *AudioEffects) SetMouseEqualizer(enabled bool, config audio.EqualizerConfig) error {
	kbsApp.SetMouseAudioEqualizer(enabled, config)
	return SaveAudioEffectsToPreferences()
}
