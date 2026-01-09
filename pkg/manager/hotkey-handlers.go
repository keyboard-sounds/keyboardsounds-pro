package manager

import (
	"log/slog"
	"math"
	"strconv"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/hotkeys"
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

func registerMuteAllHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceAll,
		Action: hotkeys.HotKeyActionMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		mgr.MuteKeyboard()
		mgr.MuteMouse()

		return nil
	})
}

func registerMuteKeyboardHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceKeyboard,
		Action: hotkeys.HotKeyActionMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		mgr.MuteKeyboard()
		return nil
	})
}

func registerMuteMouseHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceMouse,
		Action: hotkeys.HotKeyActionMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		mgr.MuteMouse()
		return nil
	})
}

// =============================================================================
// Unmute Handlers
// =============================================================================

func registerUnmuteAllHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceAll,
		Action: hotkeys.HotKeyActionUnmute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		mgr.UnmuteKeyboard()
		mgr.UnmuteMouse()

		return nil
	})
}

func registerUnmuteKeyboardHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceKeyboard,
		Action: hotkeys.HotKeyActionUnmute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		mgr.UnmuteKeyboard()
		return nil
	})
}

func registerUnmuteMouseHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceMouse,
		Action: hotkeys.HotKeyActionUnmute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		mgr.UnmuteMouse()
		return nil
	})
}

// =============================================================================
// Toggle Mute Handlers
// =============================================================================

func registerToggleMuteAllHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceAll,
		Action: hotkeys.HotKeyActionToggleMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		mgr.ToggleMuteKeyboard()
		mgr.ToggleMuteMouse()
		return nil
	})
}

func registerToggleMuteKeyboardHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceKeyboard,
		Action: hotkeys.HotKeyActionToggleMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		mgr.ToggleMuteKeyboard()
		return nil
	})
}

func registerToggleMuteMouseHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceMouse,
		Action: hotkeys.HotKeyActionToggleMute,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		mgr.ToggleMuteMouse()
		return nil
	})
}

// =============================================================================
// Volume Handlers
// =============================================================================

func registerIncreaseVolumeAllHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceAll,
		Action: hotkeys.HotKeyActionIncreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		kbv := mgr.GetKeyboardVolume()
		mv := mgr.GetMouseVolume()

		newKbv := math.Min(1.0, kbv+value)
		newMv := math.Min(1.0, mv+value)

		mgr.SetKeyboardVolume(newKbv)
		mgr.SetMouseVolume(newMv)

		return nil
	})
}

func registerDecreaseVolumeAllHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceAll,
		Action: hotkeys.HotKeyActionDecreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		kbv := mgr.GetKeyboardVolume()
		mv := mgr.GetMouseVolume()

		newKbv := math.Max(0.0, kbv-value)
		newMv := math.Max(0.0, mv-value)

		mgr.SetKeyboardVolume(newKbv)
		mgr.SetMouseVolume(newMv)

		return nil
	})
}

func registerIncreaseVolumeKeyboardHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceKeyboard,
		Action: hotkeys.HotKeyActionIncreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		kbv := mgr.GetKeyboardVolume()
		newKbv := math.Min(1.0, kbv+value)
		mgr.SetKeyboardVolume(newKbv)

		return nil
	})
}

func registerDecreaseVolumeKeyboardHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceKeyboard,
		Action: hotkeys.HotKeyActionDecreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		kbv := mgr.GetKeyboardVolume()
		newKbv := math.Max(0.0, kbv-value)
		mgr.SetKeyboardVolume(newKbv)

		return nil
	})
}

func registerIncreaseVolumeMouseHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceMouse,
		Action: hotkeys.HotKeyActionIncreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		mv := mgr.GetMouseVolume()
		newMv := math.Min(1.0, mv+value)
		mgr.SetMouseVolume(newMv)

		return nil
	})
}

func registerDecreaseVolumeMouseHotKeyHandler(mgr *Manager) {
	hotkeys.RegisterHandler(hotkeys.HotKeyDeviceAction{
		Device: hotkeys.HotKeyTargetDeviceMouse,
		Action: hotkeys.HotKeyActionDecreaseVolume,
	}, func(action hotkeys.HotKeyDeviceAction) error {
		value, err := strconv.ParseFloat(action.Value, 64)
		if err != nil {
			return err
		}

		mv := mgr.GetMouseVolume()
		newMv := math.Max(0.0, mv-value)
		mgr.SetMouseVolume(newMv)

		return nil
	})
}
