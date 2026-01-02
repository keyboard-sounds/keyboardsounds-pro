package manager

import (
	"fmt"
	"log/slog"
	"math/rand"
	"strings"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/audio"
	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/listener/listenertypes"
	"github.com/samber/lo"
)

// mouseEventWorker processes mouse button events and plays the corresponding audio.
func (m *Manager) mouseEventWorker() {
	defer func() {
		slog.Info("Mouse event worker stopped")
		m.eventWorkerWg.Done()
	}()

	if m.mouseListener == nil {
		return
	}

	eventsChan := m.mouseListener.Events()
	// Listen for mouse button events.
	for {
		select {
		case <-m.listenerCtx.Done():
			// Context cancelled, stop processing events
			return
		case event, ok := <-eventsChan:
			if !ok {
				// Channel closed, stop processing events
				return
			}

			slog.Debug("Mouse event received", "event", event)
			if m.mouseProfile == nil {
				continue
			}

			go func(e listenertypes.ButtonEvent) {
				// Check the current focus action with proper locking
				m.currentProfilesLock.RLock()
				shouldPlay := m.currentProfiles.Mouse != nil
				m.currentProfilesLock.RUnlock()

				// Only play the audio if the current focus action is not "Disable".
				if shouldPlay {
					sound, err := m.getAudioForButtonEvent(e)
					if err != nil {
						slog.Error("failed to get audio for button event", "error", err)
						return
					}

					if sound == nil {
						return
					}

					fx := audio.EffectsConfig{}

					// Apply pitch shift effect
					m.mousePitchShiftConfig.Lock.RLock()
					pitchShiftEnabled := m.mousePitchShiftConfig.Enabled
					fx.Pitch = lo.Ternary(pitchShiftEnabled, &audio.PitchConfig{
						SemitoneRange: [2]float64{m.mousePitchShiftConfig.Lower, m.mousePitchShiftConfig.Upper},
					}, nil)
					m.mousePitchShiftConfig.Lock.RUnlock()

					// Apply pan effect
					m.mousePanConfig.Lock.RLock()
					if m.mousePanConfig.Enabled {
						fx.Pan = &audio.PanConfig{
							Pan: rand.Float64()*2 - 1,
						}
					}
					m.mousePanConfig.Lock.RUnlock()

					// Apply equalizer effect
					m.mouseEqualizerConfig.Lock.RLock()
					fx.Equalizer = lo.Ternary(m.mouseEqualizerConfig.Enabled, m.mouseEqualizerConfig.Config.Copy(), nil)
					m.mouseEqualizerConfig.Lock.RUnlock()

					// Apply doppler effect
					m.mouseDopplerConfig.Lock.RLock()
					fx.Doppler = lo.Ternary(m.mouseDopplerConfig.Enabled, m.mouseDopplerConfig.Config.Copy(), nil)
					m.mouseDopplerConfig.Lock.RUnlock()

					// Apply volume effect
					m.mouseVolumeLock.RLock()
					fx.Volume = &audio.VolumeConfig{
						Volume: m.mouseVolume,
					}
					m.mouseVolumeLock.RUnlock()

					err = m.audioPlayer.Play(sound, fx)
					if err != nil {
						slog.Error("failed to play audio", "error", err)
					}
				}
			}(event)
		}
	}
}

// getAudioForButtonEvent gets the audio file for a given button event.
//
// The audio file is chosen based on the following priority:
// 1. If the button is in the m.mouseProfile.Buttons.Other map, the audio file is chosen from the map.
// 2. If the button is not in the m.mouseProfile.Buttons.Other map, the default audio file is chosen.
// 3. If there are no audio files in the m.mouseProfile.Buttons.Other map or m.mouseProfile.Buttons.Default is not set, an error is returned.
func (m *Manager) getAudioForButtonEvent(event listenertypes.ButtonEvent) (*audio.Audio, error) {
	m.mouseProfileLock.RLock()
	defer m.mouseProfileLock.RUnlock()

	if m.mouseProfile == nil {
		return nil, fmt.Errorf("no mouse profile set")
	}

	var sourceID string

	if len(m.mouseProfile.Sources) < 1 {
		return nil, fmt.Errorf("no sources found for mouse profile")
	}

	// Check if button is in the Other section
	found := false
	for _, b := range m.mouseProfile.Buttons.Other {
		if b.Buttons == nil || len(*b.Buttons) == 0 {
			continue
		}

		if lo.ContainsBy(*b.Buttons, func(button string) bool {
			return strings.EqualFold(button, string(event.Button))
		}) {
			// Source value can either be a string or a slice of strings.
			switch sourceValue := b.Sound.(type) {
			case string: // Single source ID
				sourceID = sourceValue
			case []string: // Multiple source IDs, pick a random one.
				sourceID = sourceValue[rand.Intn(len(sourceValue))]
			default:
				return nil, fmt.Errorf("invalid sound source value: %T", sourceValue)
			}
			found = true
			break
		}
	}

	// If not found in Other, use Default
	if !found {
		if len(m.mouseProfile.Buttons.Default) > 0 {
			sourceID = m.mouseProfile.Buttons.Default
		} else {
			// Use a random source.
			sourceID = m.mouseProfile.Sources[rand.Intn(len(m.mouseProfile.Sources))].ID
		}
	}

	sourceConfig, ok := m.mouseProfileSources[sourceID]
	if !ok {
		return nil, fmt.Errorf("source config not found for source %s", sourceID)
	}

	if event.Action == listenertypes.ActionRelease {
		if sourceConfig.Release != nil {
			return m.mouseProfileAudioCache[*sourceConfig.Release], nil
		}

		return nil, nil
	}

	if sourceConfig.Press != nil {
		return m.mouseProfileAudioCache[*sourceConfig.Press], nil
	}

	return nil, nil
}
