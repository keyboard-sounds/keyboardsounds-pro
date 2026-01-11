package rules

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sync"

	"github.com/samber/lo"
)

var (
	// ErrPlatformNotSupported is returned when the platform is not supported.
	ErrPlatformNotSupported = errors.New("platform not supported")
)

// Rule is a rule for a given app path.
type Rule struct {
	// AppPath is the path to the app to apply the rule to. This can be a glob pattern.
	AppPath string `json:"app_path"`
	// Profiles is the profiles to use for mouse and keyboard.
	Profiles Profiles `json:"profiles"`
	// Enabled is whether the rule is enabled.
	Enabled bool `json:"enabled"`
}

// rules is a collection of rules and default profiles.
type rules struct {
	// Default is the default profiles to use for mouse and keyboard.
	Default Profiles `json:"default"`
	// Rules is a list of rules for specific app paths.
	Rules []Rule `json:"rules"`

	filePath string
}

// profilesDiff is the difference between two profiles.
type profilesDiff struct {
	// ShouldUpdateKeyboard is whether the keyboard profile should be updated.
	ShouldUpdateKeyboard bool
	// ShouldUpdateMouse is whether the mouse profile should be updated.
	ShouldUpdateMouse bool
}

// Profiles is a collection of profiles for mouse and keyboard.
type Profiles struct {
	// Keyboard is the profile to use for the keyboard.
	Keyboard *string `json:"keyboard"`
	// Mouse is the profile to use for the mouse.
	Mouse *string `json:"mouse"`
	// IsDefault is whether the profiles are the default profiles.
	IsDefault bool `json:"-"`
}

// Diff checks if the profiles have changed.
func (p *Profiles) Diff(new Profiles) profilesDiff {
	diff := profilesDiff{}

	// Non nil to non nil transition
	if p.Keyboard != nil && new.Keyboard != nil {
		diff.ShouldUpdateKeyboard = *p.Keyboard != *new.Keyboard
	}
	if p.Mouse != nil && new.Mouse != nil {
		diff.ShouldUpdateMouse = *p.Mouse != *new.Mouse
	}

	// Non nil to nil transition
	if p.Keyboard != nil && new.Keyboard == nil {
		diff.ShouldUpdateKeyboard = true
	}
	if p.Mouse != nil && new.Mouse == nil {
		diff.ShouldUpdateMouse = true
	}

	// Nil to non nil transition
	if p.Keyboard == nil && new.Keyboard != nil {
		diff.ShouldUpdateKeyboard = true
	}
	if p.Mouse == nil && new.Mouse != nil {
		diff.ShouldUpdateMouse = true
	}

	return diff
}

var (
	rulesCache     *rules
	rulesCacheLock sync.RWMutex

	defaultProfiles = Profiles{
		Keyboard:  lo.ToPtr("mx-brown"),
		Mouse:     lo.ToPtr("g502x-wireless"),
		IsDefault: true,
	}
)

// LoadRules loads the rules.json file from the given directory. On Linux, this returns ErrPlatformNotSupported.
func LoadRules(dir string) error {
	// Application rules are currently only supported on Windows.
	if runtime.GOOS != "windows" {
		return ErrPlatformNotSupported
	}

	rulesCacheLock.Lock()
	defer rulesCacheLock.Unlock()

	rulesPath := filepath.Join(dir, "rules.json")

	// Create the rules file if it doesn't exist.
	if _, err := os.Stat(rulesPath); os.IsNotExist(err) {
		rulesCache = &rules{
			Default:  defaultProfiles,
			Rules:    make([]Rule, 0),
			filePath: rulesPath,
		}

		rulesBytes, err := json.Marshal(rulesCache)
		if err != nil {
			return fmt.Errorf("failed to marshal rules: %w", err)
		}

		err = os.WriteFile(rulesPath, rulesBytes, 0644)
		if err != nil {
			return fmt.Errorf("failed to write rules file: %w", err)
		}

		return nil
	}

	rulesBytes, err := os.ReadFile(rulesPath)
	if err != nil {
		return fmt.Errorf("failed to read rules file: %w", err)
	}

	var newRules rules
	err = json.Unmarshal(rulesBytes, &newRules)
	if err != nil {
		return fmt.Errorf("failed to unmarshal rules: %w", err)
	}
	newRules.Default.IsDefault = true

	rulesCache = &newRules

	rulesCache.filePath = rulesPath

	return nil
}

// IsValidGlobPattern checks if a given pattern is a valid glob pattern.
func IsValidGlobPattern(pattern string) bool {
	_, err := filepath.Glob(pattern)
	return err == nil
}

// GetDefaultProfiles gets the default profiles.
func GetDefaultProfiles() Profiles {
	rulesCacheLock.RLock()
	defer rulesCacheLock.RUnlock()

	if rulesCache == nil {
		return defaultProfiles
	}

	return rulesCache.Default
}

// SetDefaultProfiles sets the default profiles.
func SetDefaultProfiles(profiles Profiles) error {
	rulesCacheLock.Lock()
	defer rulesCacheLock.Unlock()

	if rulesCache == nil {
		return fmt.Errorf("no rules loaded")
	}

	profiles.IsDefault = true
	rulesCache.Default = profiles

	rulesBytes, err := json.Marshal(rulesCache)
	if err != nil {
		return fmt.Errorf("failed to marshal rules: %w", err)
	}

	err = os.WriteFile(rulesCache.filePath, rulesBytes, 0644)
	if err != nil {
		return fmt.Errorf("failed to write rules file: %w", err)
	}

	return nil
}

// GetProfilesForPath gets the profiles for a given app path.
// If no rule is found for the app, the default profiles are returned.
// If the rule is not enabled, the default profiles are returned.
// Otherwise, the profiles for the rule are returned.
func GetProfilesForPath(appPath string) Profiles {
	rulesCacheLock.RLock()
	defer rulesCacheLock.RUnlock()

	if rulesCache == nil {
		return defaultProfiles
	}

	rule, ok := lo.Find(rulesCache.Rules, func(rule Rule) bool {
		matched, _ := filepath.Match(rule.AppPath, appPath)
		return matched
	})
	// If no rule is found for the app, use the default
	if !ok {
		return rulesCache.Default
	}

	// If the rule is not enabled, use the default profiles.
	if !rule.Enabled {
		return rulesCache.Default
	}

	return rule.Profiles
}

// UpsertRule adds or updates a rule.
func UpsertRule(rule Rule) error {
	rulesCacheLock.Lock()
	defer rulesCacheLock.Unlock()

	if rulesCache == nil {
		return fmt.Errorf("no rules loaded")
	}

	// Remove any existing rules for the same app path.
	rulesCache.Rules = lo.Filter(rulesCache.Rules, func(r Rule, _ int) bool {
		return r.AppPath != rule.AppPath
	})

	// Add the new rule.
	rulesCache.Rules = append(rulesCache.Rules, rule)

	// Save the rules to the file.
	rulesBytes, err := json.Marshal(rulesCache)
	if err != nil {
		return fmt.Errorf("failed to marshal rules: %w", err)
	}

	err = os.WriteFile(rulesCache.filePath, rulesBytes, 0644)
	if err != nil {
		return fmt.Errorf("failed to write rules file: %w", err)
	}

	return nil
}

// RemoveRule removes a rule for a given app path.
func RemoveRule(appPath string) error {
	rulesCacheLock.Lock()
	defer rulesCacheLock.Unlock()

	if rulesCache == nil {
		return fmt.Errorf("no rules loaded")
	}

	// Remove the rule.
	rulesCache.Rules = lo.Filter(rulesCache.Rules, func(r Rule, _ int) bool {
		return r.AppPath != appPath
	})

	// Save the rules to the file.
	rulesBytes, err := json.Marshal(rulesCache)
	if err != nil {
		return fmt.Errorf("failed to marshal rules: %w", err)
	}

	err = os.WriteFile(rulesCache.filePath, rulesBytes, 0644)
	if err != nil {
		return fmt.Errorf("failed to write rules file: %w", err)
	}

	return nil
}

// ListRules lists all rules.
func ListRules() ([]Rule, error) {
	rulesCacheLock.RLock()
	defer rulesCacheLock.RUnlock()

	if rulesCache == nil {
		return nil, fmt.Errorf("no rules loaded")
	}

	return rulesCache.Rules, nil
}
