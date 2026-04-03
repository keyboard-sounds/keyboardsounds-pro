package app

import (
	"path/filepath"
	"runtime"
	"strings"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
)

// SetInAppFocusProfiles sets optional keyboard/mouse profile names when this process is the
// focused application and the active configuration is the global default (no matching app rule).
// nil for either field means "Use Default" for that device.
func (m *Application) SetInAppFocusProfiles(keyboard, mouse *string) {
	m.inAppFocusProfilesLock.Lock()
	m.inAppFocusProfileKeyboard = cloneStrPtr(keyboard)
	m.inAppFocusProfileMouse = cloneStrPtr(mouse)
	m.inAppFocusProfilesLock.Unlock()
	m.reevaluateProfilesForCurrentFocus()
}

func cloneStrPtr(p *string) *string {
	if p == nil {
		return nil
	}
	s := *p
	return &s
}

func (m *Application) resolveProfilesForExecutable(focusedPath string) rules.Profiles {
	base := rules.GetProfilesForPath(focusedPath)
	if m.executablePathsMatch(focusedPath) && base.IsDefault {
		return m.applyInAppFocusOverrides(base)
	}
	return base
}

func (m *Application) applyInAppFocusOverrides(base rules.Profiles) rules.Profiles {
	m.inAppFocusProfilesLock.RLock()
	kb := m.inAppFocusProfileKeyboard
	ms := m.inAppFocusProfileMouse
	m.inAppFocusProfilesLock.RUnlock()

	if kb == nil && ms == nil {
		return base
	}

	out := rules.Profiles{}
	if base.Keyboard != nil {
		v := *base.Keyboard
		out.Keyboard = &v
	}
	if base.Mouse != nil {
		v := *base.Mouse
		out.Mouse = &v
	}
	out.IsDefault = base.IsDefault

	if kb != nil {
		v := *kb
		out.Keyboard = &v
	}
	if ms != nil {
		v := *ms
		out.Mouse = &v
	}
	out.IsDefault = false
	return out
}

func (m *Application) executablePathsMatch(focused string) bool {
	if m.selfExecutablePath == "" || focused == "" {
		return false
	}
	foc := filepath.Clean(focused)
	if runtime.GOOS == "windows" {
		return strings.EqualFold(foc, m.selfExecutablePath)
	}
	return foc == m.selfExecutablePath
}

// reevaluateProfilesForCurrentFocus re-applies profile resolution for the last reported foreground app.
// Used when settings change and we want rules/defaults/in-app overrides to apply immediately.
func (m *Application) reevaluateProfilesForCurrentFocus() {
	m.lastFocusedExecutableLock.Lock()
	path := m.lastFocusedExecutable
	m.lastFocusedExecutableLock.Unlock()

	if path == "" || !m.IsEnabled() {
		return
	}

	resolved := m.resolveProfilesForExecutable(path)
	m.updateProfiles(resolved)
}
