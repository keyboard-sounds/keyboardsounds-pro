package app

import (
	"path/filepath"
	gort "runtime"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
)

// ApplicationRulesHeroContext describes the app shown in the Application Rules page hero
// (foreground app, or last non-self focused app while this app is focused).
type ApplicationRulesHeroContext struct {
	Supported        bool    `json:"supported"`
	AppPath          string  `json:"appPath"`
	ExecutableName   string  `json:"executableName"`
	KeyboardProfile  *string `json:"keyboardProfile"`
	MouseProfile     *string `json:"mouseProfile"`
	UsingDefaults    bool    `json:"usingDefaults"`
	MatchingRulePath *string `json:"matchingRulePath"`
	FocusIsSelf      bool    `json:"focusIsSelf"`
}

// GetApplicationRulesHeroContext returns resolved profiles for the hero target app.
func (m *Application) GetApplicationRulesHeroContext() ApplicationRulesHeroContext {
	out := ApplicationRulesHeroContext{Supported: gort.GOOS == "darwin" || gort.GOOS == "windows"}
	if !out.Supported {
		return out
	}

	m.lastFocusedExecutableLock.Lock()
	focused := m.lastFocusedExecutable
	lastOther := m.lastNonSelfFocusedExecutable
	m.lastFocusedExecutableLock.Unlock()

	if focused == "" {
		return out
	}

	var displayPath string
	if m.executablePathsMatch(focused) {
		out.FocusIsSelf = true
		displayPath = lastOther
	} else {
		displayPath = focused
	}

	if displayPath == "" {
		return out
	}

	out.AppPath = displayPath
	out.ExecutableName = filepath.Base(displayPath)

	resolved := m.resolveProfilesForExecutable(displayPath)
	out.KeyboardProfile = resolved.Keyboard
	out.MouseProfile = resolved.Mouse

	if rule, ok := rules.FindMatchingRuleForPath(displayPath); ok {
		p := rule.AppPath
		out.MatchingRulePath = &p
		// Disabled rules do not apply, so effective sound is still global defaults,
		// but the hero must still know a rule exists (toggle/remove UI).
		out.UsingDefaults = !rule.Enabled
	} else {
		out.UsingDefaults = true
	}

	return out
}
