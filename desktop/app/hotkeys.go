package app

import (
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/hotkeys"
)

// HotKeys is the Wails binding for hotkeys configuration
type HotKeys struct{}

// NewHotKeys creates a new HotKeys instance
func NewHotKeys() *HotKeys {
	return &HotKeys{}
}

// GetHotKeys returns the current hotkeys configuration
func (h *HotKeys) GetHotKeys() hotkeys.HotKeys {
	return hotkeys.GetHotKeys()
}

// SetHotKeys sets the current hotkeys configuration
func (h *HotKeys) SetHotKeys(hotKeys hotkeys.HotKeys) error {
	return hotkeys.SetHotKeys(hotKeys)
}
