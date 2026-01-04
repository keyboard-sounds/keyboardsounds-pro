package manager

import (
	"log/slog"
	"sync"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/audio"
)

// PanType represents the type of panning to apply to the audio.
type PanType string

var (
	// PanTypeKeyPosition represents the type of panning to apply to the audio based on the key position.
	PanTypeKeyPosition PanType = "key-position"
	// PanTypeRandom represents the type of panning to apply to the audio randomly.
	PanTypeRandom PanType = "random"
)

type managerPitchShiftConfig struct {
	Enabled bool
	Lower   float64
	Upper   float64
	Lock    sync.RWMutex
}

type managerPanConfig struct {
	Enabled bool
	PanType PanType
	MaxX    int
	Lock    sync.RWMutex
}

type managerEqualizerConfig struct {
	Enabled bool
	Config  audio.EqualizerConfig
	Lock    sync.RWMutex
}

type managerDopplerConfig struct {
	Enabled bool
	Config  audio.DopplerConfig
	Lock    sync.RWMutex
}

// SetAudioPitchShift sets the pitch shift semi-tone value upper and lower bounds.
// If either lower or upper is 0, pitch shift is disabled.
func (m *Manager) SetKeyboardAudioPitchShift(enabled bool, lower, upper float64) {
	m.keyboardPitchShiftConfig.Lock.Lock()
	defer m.keyboardPitchShiftConfig.Lock.Unlock()

	m.keyboardPitchShiftConfig.Lower = lower
	m.keyboardPitchShiftConfig.Upper = upper
	m.keyboardPitchShiftConfig.Enabled = enabled && lower != 0 && upper != 0

	slog.Info("Set keyboard audio pitch shift", "enabled", enabled, "lower", lower, "upper", upper)
}

// SetKeyboardAudioPan sets the audio pan type and maximum number of contiguous horizontal keys in the keyboard.
func (m *Manager) SetKeyboardAudioPan(enabled bool, panType PanType, maxX int) {
	m.keyboardPanConfig.Lock.Lock()
	defer m.keyboardPanConfig.Lock.Unlock()

	m.keyboardPanConfig.Enabled = enabled
	m.keyboardPanConfig.PanType = panType
	m.keyboardPanConfig.MaxX = maxX

	slog.Info("Set keyboard audio pan", "panType", panType)
}

// SetKeyboardAudioEqualizer sets the equalizer configuration and target.
func (m *Manager) SetKeyboardAudioEqualizer(enabled bool, config audio.EqualizerConfig) {
	m.keyboardEqualizerConfig.Lock.Lock()
	defer m.keyboardEqualizerConfig.Lock.Unlock()

	m.keyboardEqualizerConfig.Enabled = enabled
	m.keyboardEqualizerConfig.Config = config

	slog.Info("Set keyboard audio equalizer", "enabled", enabled)
}

// SetKeyboardAudioDoppler sets the doppler configuration and target.
func (m *Manager) SetKeyboardAudioDoppler(enabled bool, config audio.DopplerConfig) {
	m.keyboardDopplerConfig.Lock.Lock()
	defer m.keyboardDopplerConfig.Lock.Unlock()

	m.keyboardDopplerConfig.Enabled = enabled
	m.keyboardDopplerConfig.Config = config

	slog.Info("Set keyboard audio doppler", "enabled", enabled)
}

// SetMouseAudioPitchShift sets the pitch shift semi-tone value upper and lower bounds.
func (m *Manager) SetMouseAudioPitchShift(enabled bool, lower, upper float64) {
	m.mousePitchShiftConfig.Lock.Lock()
	defer m.mousePitchShiftConfig.Lock.Unlock()

	m.mousePitchShiftConfig.Lower = lower
	m.mousePitchShiftConfig.Upper = upper
	m.mousePitchShiftConfig.Enabled = enabled && lower != 0 && upper != 0

	slog.Info("Set mouse audio pitch shift", "enabled", enabled, "lower", lower, "upper", upper)
}

// SetMouseAudioPan sets the audio pan type and maximum number of contiguous horizontal keys in the keyboard.
func (m *Manager) SetMouseAudioPan(enabled bool) {
	m.mousePanConfig.Lock.Lock()
	defer m.mousePanConfig.Lock.Unlock()

	m.mousePanConfig.Enabled = enabled
	m.mousePanConfig.PanType = PanTypeRandom

	slog.Info("Set mouse audio pan", "enabled", enabled)
}

// SetMouseAudioEqualizer sets the equalizer configuration and target.
func (m *Manager) SetMouseAudioEqualizer(enabled bool, config audio.EqualizerConfig) {
	m.mouseEqualizerConfig.Lock.Lock()
	defer m.mouseEqualizerConfig.Lock.Unlock()

	m.mouseEqualizerConfig.Enabled = enabled
	m.mouseEqualizerConfig.Config = config

	slog.Info("Set mouse audio equalizer", "enabled", enabled)
}

// SetMouseAudioDoppler sets the doppler configuration and target.
func (m *Manager) SetMouseAudioDoppler(enabled bool, config audio.DopplerConfig) {
	m.mouseDopplerConfig.Lock.Lock()
	defer m.mouseDopplerConfig.Lock.Unlock()

	m.mouseDopplerConfig.Enabled = enabled
	m.mouseDopplerConfig.Config = config

	slog.Info("Set mouse audio doppler", "enabled", enabled)
}

// GetKeyboardAudioPitchShift gets the pitch shift semi-tone value upper and lower bounds.
func (m *Manager) GetKeyboardAudioPitchShift() (enabled bool, lower, upper float64) {
	m.keyboardPitchShiftConfig.Lock.RLock()
	defer m.keyboardPitchShiftConfig.Lock.RUnlock()

	return m.keyboardPitchShiftConfig.Enabled, m.keyboardPitchShiftConfig.Lower, m.keyboardPitchShiftConfig.Upper
}

// GetKeyboardAudioPan gets the audio pan type and maximum number of contiguous horizontal keys in the keyboard.
func (m *Manager) GetKeyboardAudioPan() (enabled bool, panType PanType, maxX int) {
	m.keyboardPanConfig.Lock.RLock()
	defer m.keyboardPanConfig.Lock.RUnlock()

	return m.keyboardPanConfig.Enabled, m.keyboardPanConfig.PanType, m.keyboardPanConfig.MaxX
}

// GetKeyboardAudioEqualizer gets the equalizer configuration and target.
func (m *Manager) GetKeyboardAudioEqualizer() (enabled bool, config *audio.EqualizerConfig) {
	m.keyboardEqualizerConfig.Lock.RLock()
	defer m.keyboardEqualizerConfig.Lock.RUnlock()

	return m.keyboardEqualizerConfig.Enabled, m.keyboardEqualizerConfig.Config.Copy()
}

// GetKeyboardAudioDoppler gets the doppler configuration and target.
func (m *Manager) GetKeyboardAudioDoppler() (enabled bool, config *audio.DopplerConfig) {
	m.keyboardDopplerConfig.Lock.RLock()
	defer m.keyboardDopplerConfig.Lock.RUnlock()

	return m.keyboardDopplerConfig.Enabled, m.keyboardDopplerConfig.Config.Copy()
}

// GetMouseAudioPitchShift gets the pitch shift semi-tone value upper and lower bounds.
func (m *Manager) GetMouseAudioPitchShift() (enabled bool, lower, upper float64) {
	m.mousePitchShiftConfig.Lock.RLock()
	defer m.mousePitchShiftConfig.Lock.RUnlock()

	return m.mousePitchShiftConfig.Enabled, m.mousePitchShiftConfig.Lower, m.mousePitchShiftConfig.Upper
}

// GetMouseAudioPan gets the audio pan type and maximum number of contiguous horizontal keys in the keyboard.
func (m *Manager) GetMouseAudioPan() (enabled bool) {
	m.mousePanConfig.Lock.RLock()
	defer m.mousePanConfig.Lock.RUnlock()

	return m.mousePanConfig.Enabled
}

// GetMouseAudioEqualizer gets the equalizer configuration and target.
func (m *Manager) GetMouseAudioEqualizer() (enabled bool, config *audio.EqualizerConfig) {
	m.mouseEqualizerConfig.Lock.RLock()
	defer m.mouseEqualizerConfig.Lock.RUnlock()

	return m.mouseEqualizerConfig.Enabled, m.mouseEqualizerConfig.Config.Copy()
}

// GetMouseAudioDoppler gets the doppler configuration and target.
func (m *Manager) GetMouseAudioDoppler() (enabled bool, config *audio.DopplerConfig) {
	m.mouseDopplerConfig.Lock.RLock()
	defer m.mouseDopplerConfig.Lock.RUnlock()

	return m.mouseDopplerConfig.Enabled, m.mouseDopplerConfig.Config.Copy()
}

// SetKeyboardVolume sets the volume for the keyboard audio player.
func (m *Manager) SetKeyboardVolume(volume float64) error {
	m.keyboardVolumeLock.Lock()
	defer m.keyboardVolumeLock.Unlock()
	if volume < 0.0 {
		volume = 0.0
	} else if volume > 1.0 {
		volume = 1.0
	}

	m.keyboardVolume = volume
	return nil
}

// GetKeyboardVolume gets the volume for the keyboard audio player.
func (m *Manager) GetKeyboardVolume() float64 {
	m.keyboardVolumeLock.RLock()
	defer m.keyboardVolumeLock.RUnlock()
	return m.keyboardVolume
}

// SetMouseVolume sets the volume for the mouse audio player.
func (m *Manager) SetMouseVolume(volume float64) error {
	m.mouseVolumeLock.Lock()
	defer m.mouseVolumeLock.Unlock()
	if volume < 0.0 {
		volume = 0.0
	} else if volume > 1.0 {
		volume = 1.0
	}

	m.mouseVolume = volume
	return nil
}

// GetMouseVolume gets the volume for the mouse audio player.
func (m *Manager) GetMouseVolume() float64 {
	m.mouseVolumeLock.RLock()
	defer m.mouseVolumeLock.RUnlock()
	return m.mouseVolume
}
