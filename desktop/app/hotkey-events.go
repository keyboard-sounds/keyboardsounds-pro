package app

import (
	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/hotkeys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// RegisterHotKeyEventDelegate registers a delegate that emits Wails events when hotkeys are triggered
func RegisterHotKeyEventDelegate() {
	hotkeys.RegisterDelegate(func(event hotkeys.HotKeyEvent) {
		// Emit event to notify frontend that state may have changed
		// The frontend will listen for this event and refresh the state
		if ctx != nil {
			runtime.EventsEmit(ctx, "hotkey-state-changed")
		}
	})
}
