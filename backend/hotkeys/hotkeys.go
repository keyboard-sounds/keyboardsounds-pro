package hotkeys

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/key"
	"gopkg.in/yaml.v2"
)

// HotKeys is a collection of hotkey configurations.
type HotKeys []HotKeyGroup

type HotKeyGroup struct {
	// The keys that are required for any of the handlers to be triggered.
	Modifiers []string `json:"modifiers"`
	// The keys and their corresponding actions.
	Keys []HotKey `json:"keys"`
}

type HotKey struct {
	Key    string             `json:"key"`
	Action HotKeyDeviceAction `json:"action"`
}

// defaultHotKeys is the default hotkeys configuration.
var defaultHotKeys = HotKeys{
	{
		Modifiers: []string{key.LeftControl.Name, key.LeftShift.Name, key.LeftAlt.Name},
		Keys: []HotKey{
			{
				Key: key.M.Name,
				Action: HotKeyDeviceAction{
					Device: HotKeyTargetDeviceAll,
					Action: HotKeyActionMute,
				},
			},
			{
				Key: key.U.Name,
				Action: HotKeyDeviceAction{
					Device: HotKeyTargetDeviceAll,
					Action: HotKeyActionUnmute,
				},
			},
			{
				Key: key.Up.Name,
				Action: HotKeyDeviceAction{
					Device: HotKeyTargetDeviceAll,
					Action: HotKeyActionIncreaseVolume,
					Value:  "0.1",
				},
			},
			{
				Key: key.Down.Name,
				Action: HotKeyDeviceAction{
					Device: HotKeyTargetDeviceAll,
					Action: HotKeyActionDecreaseVolume,
					Value:  "0.1",
				},
			},
		},
	},
}

var (
	cfgDir             string
	cfgDirLock         sync.RWMutex
	currentHotKeys     = defaultHotKeys
	currentHotKeysLock sync.RWMutex
)

// LoadHotKeys loads the hotkeys from the configuration directory.
func LoadHotKeys(dir string) error {
	cfgDirLock.Lock()
	cfgDir = dir
	cfgDirLock.Unlock()

	hotKeyConfigFile := filepath.Join(dir, "hotkeys.yaml")
	if _, err := os.Stat(hotKeyConfigFile); os.IsNotExist(err) {
		// Write the default hotkeys to the file.
		hotKeyConfig, err := yaml.Marshal(defaultHotKeys)
		if err != nil {
			return fmt.Errorf("failed to marshal default hotkeys: %w", err)
		}
		err = os.WriteFile(hotKeyConfigFile, hotKeyConfig, 0644)
		if err != nil {
			return fmt.Errorf("failed to write default hotkeys to file: %w", err)
		}

		return nil
	}

	hotKeyConfig, err := os.ReadFile(hotKeyConfigFile)
	if err != nil {
		return fmt.Errorf("failed to read hotkey config file: %w", err)
	}

	var hotKeys HotKeys
	err = yaml.Unmarshal(hotKeyConfig, &hotKeys)
	if err != nil {
		return fmt.Errorf("failed to unmarshal hotkey config: %w", err)
	}

	currentHotKeysLock.Lock()
	currentHotKeys = hotKeys
	currentHotKeysLock.Unlock()

	return nil
}

// GetHotKeys returns the current hotkeys.
func GetHotKeys() HotKeys {
	currentHotKeysLock.RLock()
	defer currentHotKeysLock.RUnlock()
	return currentHotKeys
}

// SetHotKeys sets the current hotkeys.
func SetHotKeys(hotKeys HotKeys) error {
	currentHotKeysLock.Lock()
	defer currentHotKeysLock.Unlock()
	currentHotKeys = hotKeys

	hotKeyConfigFile := filepath.Join(cfgDir, "hotkeys.yaml")

	hotKeyConfig, err := yaml.Marshal(hotKeys)
	if err != nil {
		return fmt.Errorf("failed to marshal hotkeys: %w", err)
	}
	err = os.WriteFile(hotKeyConfigFile, hotKeyConfig, 0644)
	if err != nil {
		return fmt.Errorf("failed to write hotkeys to file: %w", err)
	}

	return nil
}
