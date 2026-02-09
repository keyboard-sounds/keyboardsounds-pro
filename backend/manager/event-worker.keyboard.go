package manager

import (
	"fmt"
	"log/slog"
	"math/rand"
	"strings"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/audio"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/hotkeys"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/key"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener/listenertypes"
	"github.com/samber/lo"
)

func (m *Manager) keyboardEventWorker() {
	defer func() {
		slog.Info("Keyboard event worker stopped")
		m.eventWorkerWg.Done()
	}()

	eventsChan := m.keyboardListener.Events()
	// Listen for keyboard events.
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

			slog.Debug("Keyboard event received", "event", event)

			go func(e listenertypes.KeyEvent) {
				// Ignore key repeat.
				if e.Action == listenertypes.ActionPress {
					var keyDown bool
					m.keyboardKeysDownLock.RLock()
					if len(m.keyboardKeysDown) > 0 {
						keyDown = lo.Contains(m.keyboardKeysDown, e.Key)
					}
					m.keyboardKeysDownLock.RUnlock()
					if keyDown {
						return
					}
				}

				// Update the keys that are currently down.
				m.keyboardKeysDownLock.Lock()

				if e.Action == listenertypes.ActionPress {
					m.keyboardKeysDown = append(m.keyboardKeysDown, e.Key)
				} else {
					m.keyboardKeysDown = lo.Filter(m.keyboardKeysDown, func(key key.Key, _ int) bool {
						return key != e.Key
					})
				}

				if m.GetOSKHelperEnabled() {
					m.oskHelperLock.RLock()

					if e.Action == listenertypes.ActionPress {
						if len(m.keyboardKeysDown) > 1 && key.IsModifierKey(m.keyboardKeysDown[0]) {
							err := m.oskHelper.SetOnScreenText(*m.oskHelperConfig, strings.Join(
								lo.Map(m.keyboardKeysDown, func(key key.Key, _ int) string {
									return key.Name
								}),
								" + ",
							))
							if err != nil {
								slog.Error("failed to set on screen text", "error", err)
							}
						} else {
							m.oskHelper.ClearOnScreenText()
						}
					} else {
						if len(m.keyboardKeysDown) == 0 || !key.IsModifierKey(m.keyboardKeysDown[0]) {
							m.oskHelper.ClearOnScreenText()
						}
					}

					m.oskHelperLock.RUnlock()
				}

				m.keyboardKeysDownLock.Unlock()

				// On release, determine if a hot key was triggered.
				if e.Action == listenertypes.ActionRelease {
					// Make a copy of the keys down to avoid race conditions.
					m.keyboardKeysDownLock.RLock()
					keysDown := make([]key.Key, len(m.keyboardKeysDown))
					copy(keysDown, m.keyboardKeysDown)
					m.keyboardKeysDownLock.RUnlock()

					// TODO: Also copy hot key configs to avoid race conditions.

					go func() {
						err := hotkeys.GetHotKeys().Execute(hotkeys.ExecuteArg{
							Event:    e,
							KeysDown: keysDown,
						})

						if err != nil {
							slog.Error("failed to execute hot key", "error", err)
						}
					}()
				}

				if m.keyboardProfile == nil {
					return
				}

				// Check the current focus action with proper locking
				m.currentProfilesLock.RLock()
				shouldPlay := m.currentProfiles.Keyboard != nil
				m.currentProfilesLock.RUnlock()

				// Only play the audio if the current focus action is not "Disable".
				if shouldPlay {
					sound, err := m.getAudioForKeyEvent(e)
					if err != nil {
						slog.Error("failed to get audio for key event", "error", err)
						return
					}

					if sound == nil {
						return
					}

					fx := audio.EffectsConfig{}

					// Apply pitch shift effect
					m.keyboardPitchShiftConfig.Lock.RLock()
					fx.Pitch = lo.Ternary(m.keyboardPitchShiftConfig.Enabled, &audio.PitchConfig{
						SemitoneRange: [2]float64{m.keyboardPitchShiftConfig.Lower, m.keyboardPitchShiftConfig.Upper},
					}, nil)
					m.keyboardPitchShiftConfig.Lock.RUnlock()

					// Apply pan effect
					m.keyboardPanConfig.Lock.RLock()
					audioPanEnabled := m.keyboardPanConfig.Enabled
					var panValue float64
					switch m.keyboardPanConfig.PanType {
					case PanTypeRandom:
						if audioPanEnabled {
							panValue = rand.Float64()*2 - 1
						}
					case PanTypeKeyPosition:
						if audioPanEnabled && e.Key.GetPosition() != nil {
							panValue = key.PanValueForKeyPosition(*e.Key.GetPosition(), m.keyboardPanConfig.MaxX)
						}
					}
					fx.Pan = lo.Ternary(audioPanEnabled && panValue != 0, &audio.PanConfig{
						Pan: panValue,
					}, nil)
					m.keyboardPanConfig.Lock.RUnlock()

					// Apply equalizer effect
					m.keyboardEqualizerConfig.Lock.RLock()
					fx.Equalizer = lo.Ternary(m.keyboardEqualizerConfig.Enabled, m.keyboardEqualizerConfig.Config.Copy(), nil)
					m.keyboardEqualizerConfig.Lock.RUnlock()

					// Apply doppler effect
					m.keyboardDopplerConfig.Lock.RLock()
					fx.Doppler = lo.Ternary(m.keyboardDopplerConfig.Enabled, m.keyboardDopplerConfig.Config.Copy(), nil)
					m.keyboardDopplerConfig.Lock.RUnlock()

					// Apply volume effect
					m.keyboardVolumeLock.RLock()
					fx.Volume = &audio.VolumeConfig{
						Volume: m.keyboardVolume,
					}
					m.keyboardVolumeLock.RUnlock()

					err = m.audioPlayer.Play(sound, fx)
					if err != nil {
						slog.Error("failed to play audio", "error", err)
					}
				}
			}(event)
		}
	}
}

// getAudioForKeyEvent gets the audio file for a given key event.
//
// The audio file is chosen based on the following priority:
// 1. If the key is in the m.keyboardProfile.Keys.Other map, the audio file is chosen from the map.
// 2. If the key is not in the m.keyboardProfile.Keys.Other map, the audio file is chosen randomly from the m.keyboardProfile.Keys.Default slice.
// 3. If there are no audio files in the m.keyboardProfile.Keys.Other map or m.keyboardProfile.Keys.Default slice, a random souce will be selected.
func (m *Manager) getAudioForKeyEvent(event listenertypes.KeyEvent) (*audio.Audio, error) {
	m.keyboardProfileLock.RLock()
	defer m.keyboardProfileLock.RUnlock()

	if m.keyboardProfile == nil {
		return nil, fmt.Errorf("no profile set")
	}

	if len(m.keyboardProfile.Sources) < 1 {
		return nil, fmt.Errorf("no sources found for keyboard profile")
	}

	var sourceID string

	// Check if an "other" config exists for this key.
	if len(m.keyboardProfile.Keys.Other) > 0 {
		for _, k := range m.keyboardProfile.Keys.Other {
			if k.Keys == nil || len(*k.Keys) == 0 {
				continue
			}

			if lo.ContainsBy(*k.Keys, func(key string) bool {
				return strings.EqualFold(key, event.Key.Name) || strings.EqualFold(key, fmt.Sprintf("%d", event.Key.Code))
			}) {
				// Source value can either be a string or a slice of strings.
				switch sourceValue := k.Sound.(type) {
				case string: // Single source ID
					sourceID = sourceValue
				case []any: // Multiple source IDs, pick a random one.
					sourceID = sourceValue[rand.Intn(len(sourceValue))].(string)
				case []string: // Multiple source IDs, pick a random one.
					sourceID = sourceValue[rand.Intn(len(sourceValue))]
				default:
					return nil, fmt.Errorf("invalid sound source value: %T", sourceValue)
				}
			}
		}
	}

	// Attempt to pick from the default sources, if any are configured.
	if sourceID == "" {
		if len(m.keyboardProfile.Keys.Default) > 0 {
			sourceID = m.keyboardProfile.Keys.Default[rand.Intn(len(m.keyboardProfile.Keys.Default))]
		}
	}

	// Fall back on using a random source from the sources list.
	if sourceID == "" {
		sourceID = m.keyboardProfile.Sources[rand.Intn(len(m.keyboardProfile.Sources))].ID
	}

	sourceConfig, ok := m.keyboardProfileSources[sourceID]
	if !ok {
		return nil, fmt.Errorf("source config not found for source %s", sourceID)
	}

	if event.Action == listenertypes.ActionRelease {
		if sourceConfig.Release != nil {
			return m.keyboardProfileAudioCache[*sourceConfig.Release], nil
		}

		return nil, nil
	}

	if sourceConfig.Press != nil {
		return m.keyboardProfileAudioCache[*sourceConfig.Press], nil
	}

	return nil, nil
}
