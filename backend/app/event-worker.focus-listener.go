package app

import (
	"log/slog"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/profile"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
)

// focusEventWorker processes focus events and updates the currentFocusAction.
func (m *Application) focusEventWorker() {
	defer func() {
		slog.Info("Focus event worker stopped")
		m.eventWorkerWg.Done()
	}()

	if m.focusDetector == nil {
		return
	}

	eventsChan := m.focusDetector.Events()
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

			m.lastFocusedExecutableLock.Lock()
			m.lastFocusedExecutable = event.Executable
			if !m.executablePathsMatch(event.Executable) {
				m.lastNonSelfFocusedExecutable = event.Executable
			}
			m.lastFocusedExecutableLock.Unlock()

			newProfiles := m.resolveProfilesForExecutable(event.Executable)
			m.updateProfiles(newProfiles)
		}
	}
}

func (m *Application) updateProfiles(newProfiles rules.Profiles) {
	m.currentProfilesLock.RLock()
	diff := m.currentProfiles.Diff(newProfiles)
	m.currentProfilesLock.RUnlock()

	var (
		ok                 bool
		ruleValidated      bool = diff.ShouldUpdateKeyboard || diff.ShouldUpdateMouse
		newKeyboardProfile *profile.Profile
		newMouseProfile    *profile.Profile
	)

	if diff.ShouldUpdateKeyboard && newProfiles.Keyboard != nil {
		newKeyboardProfile, ok = profile.FindProfileByName(*newProfiles.Keyboard)
		if !ok {
			slog.Error("application rule ignored: failed to find keyboard profile", "profile", *newProfiles.Keyboard)
			ruleValidated = false
		} else {
			if newKeyboardProfile == nil {
				slog.Error("application rule ignored: failed to find keyboard profile", "profile", *newProfiles.Keyboard)
				ruleValidated = false
			} else {
				if newKeyboardProfile.Details.DeviceType != profile.DeviceTypeKeyboard {
					slog.Error("application rule ignored: keyboard profile is not a keyboard profile", "profile", *newProfiles.Keyboard)
					ruleValidated = false
				}
			}
		}
	}
	if ruleValidated && diff.ShouldUpdateMouse && newProfiles.Mouse != nil {
		newMouseProfile, ok = profile.FindProfileByName(*newProfiles.Mouse)
		if !ok {
			slog.Error("application rule ignored: failed to find mouse profile", "profile", *newProfiles.Mouse)
			ruleValidated = false
		} else {
			if newMouseProfile == nil {
				slog.Error("application rule ignored: failed to find mouse profile", "profile", *newProfiles.Mouse)
				ruleValidated = false
			} else {
				if newMouseProfile.Details.DeviceType != profile.DeviceTypeMouse {
					slog.Error("application rule ignored: mouse profile is not a mouse profile", "profile", *newProfiles.Mouse)
					ruleValidated = false
				}
			}
		}
	}

	if diff.ShouldUpdateKeyboard {
		if newKeyboardProfile != nil {
			slog.Info("Setting keyboard", "profile", newKeyboardProfile.Details.Name)
		} else {
			slog.Info("Setting keyboard", "profile", "nil")
		}
		err := m.setKeyboardProfile(newKeyboardProfile)
		if err != nil {
			slog.Error("failed to set keyboard profile", "error", err)
			ruleValidated = false
		}
	}

	if diff.ShouldUpdateMouse {
		if newMouseProfile != nil {
			slog.Info("Setting mouse", "profile", newMouseProfile.Details.Name)
		} else {
			slog.Info("Setting mouse", "profile", "nil")
		}
		err := m.setMouseProfile(newMouseProfile)
		if err != nil {
			slog.Error("failed to set mouse profile", "error", err)
			ruleValidated = false
		}
	}

	if ruleValidated {
		m.currentProfilesLock.Lock()
		m.currentProfiles = newProfiles
		m.currentProfilesLock.Unlock()
	}
}
