package app

import (
	"log/slog"
	"math"
	"strconv"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/hotkeys"
)

// =============================================================================
// Delegate
// =============================================================================

func registerHotKeyDelegate() {
	hotkeys.RegisterDelegate(func(event hotkeys.HotKeyEvent) {
		slog.Info("hotkey processed", "event", event)
	})
}

// =============================================================================
// Mute Handlers
// =============================================================================

func registerMuteAllHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceAll,
		Action: hotkeys.HotKeyActionMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		kbsApp.MuteKeyboard()
		kbsApp.MuteMouse()

		return nil
	})
}

func registerMuteKeyboardHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceKeyboard,
		Action: hotkeys.HotKeyActionMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		kbsApp.MuteKeyboard()
		return nil
	})
}

func registerMuteMouseHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceMouse,
		Action: hotkeys.HotKeyActionMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		kbsApp.MuteMouse()
		return nil
	})
}

// =============================================================================
// Unmute Handlers
// =============================================================================

func registerUnmuteAllHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceAll,
		Action: hotkeys.HotKeyActionUnmute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		kbsApp.UnmuteKeyboard()
		kbsApp.UnmuteMouse()

		return nil
	})
}

func registerUnmuteKeyboardHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceKeyboard,
		Action: hotkeys.HotKeyActionUnmute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		kbsApp.UnmuteKeyboard()
		return nil
	})
}

func registerUnmuteMouseHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceMouse,
		Action: hotkeys.HotKeyActionUnmute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		kbsApp.UnmuteMouse()
		return nil
	})
}

// =============================================================================
// Toggle Mute Handlers
// =============================================================================

func registerToggleMuteAllHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceAll,
		Action: hotkeys.HotKeyActionToggleMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		kbsApp.ToggleMuteKeyboard()
		kbsApp.ToggleMuteMouse()
		return nil
	})
}

func registerToggleMuteKeyboardHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceKeyboard,
		Action: hotkeys.HotKeyActionToggleMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		kbsApp.ToggleMuteKeyboard()
		return nil
	})
}

func registerToggleMuteMouseHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceMouse,
		Action: hotkeys.HotKeyActionToggleMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		kbsApp.ToggleMuteMouse()
		return nil
	})
}

// =============================================================================
// Volume Handlers
// =============================================================================

func registerIncreaseVolumeAllHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceAll,
		Action: hotkeys.HotKeyActionIncreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		kbv := kbsApp.GetKeyboardVolume()
		mv := kbsApp.GetMouseVolume()

		newKbv := math.Min(maxPlaybackVolume, kbv+value)
		newMv := math.Min(maxPlaybackVolume, mv+value)

		kbsApp.SetKeyboardVolume(newKbv)
		kbsApp.SetMouseVolume(newMv)

		return nil
	})
}

func registerDecreaseVolumeAllHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceAll,
		Action: hotkeys.HotKeyActionDecreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		kbv := kbsApp.GetKeyboardVolume()
		mv := kbsApp.GetMouseVolume()

		newKbv := math.Max(0.0, kbv-value)
		newMv := math.Max(0.0, mv-value)

		kbsApp.SetKeyboardVolume(newKbv)
		kbsApp.SetMouseVolume(newMv)

		return nil
	})
}

func registerIncreaseVolumeKeyboardHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceKeyboard,
		Action: hotkeys.HotKeyActionIncreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		kbv := kbsApp.GetKeyboardVolume()
		newKbv := math.Min(maxPlaybackVolume, kbv+value)
		kbsApp.SetKeyboardVolume(newKbv)

		return nil
	})
}

func registerDecreaseVolumeKeyboardHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceKeyboard,
		Action: hotkeys.HotKeyActionDecreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		kbv := kbsApp.GetKeyboardVolume()
		newKbv := math.Max(0.0, kbv-value)
		kbsApp.SetKeyboardVolume(newKbv)

		return nil
	})
}

func registerIncreaseVolumeMouseHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceMouse,
		Action: hotkeys.HotKeyActionIncreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		mv := kbsApp.GetMouseVolume()
		newMv := math.Min(maxPlaybackVolume, mv+value)
		kbsApp.SetMouseVolume(newMv)

		return nil
	})
}

func registerDecreaseVolumeMouseHotKeyHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceMouse,
		Action: hotkeys.HotKeyActionDecreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		mv := kbsApp.GetMouseVolume()
		newMv := math.Max(0.0, mv-value)
		kbsApp.SetMouseVolume(newMv)

		return nil
	})
}

// =============================================================================
// Other Handlers
// =============================================================================

func registerToggleOSKHelpersHandler(kbsApp *Application) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceNone,
		Action: hotkeys.HotKeyActionToggleOSKHelpers,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		enabled := kbsApp.GetOSKHelperEnabled()
		kbsApp.SetOSKHelperEnabled(!enabled)

		return nil
	})
}
