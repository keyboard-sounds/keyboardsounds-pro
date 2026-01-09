package hotkeys

import (
	"fmt"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/key"
	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/listener/listenertypes"
	"github.com/samber/lo"
)

type HotKeyTargetDevice string

const (
	HotKeyTargetDeviceAll      HotKeyTargetDevice = "all"
	HotKeyTargetDeviceKeyboard HotKeyTargetDevice = "keyboard"
	HotKeyTargetDeviceMouse    HotKeyTargetDevice = "mouse"
	HotKeyTargetDeviceNone     HotKeyTargetDevice = "none"
)

type HotKeyAction string

const (
	HotKeyActionMute           HotKeyAction = "mute"
	HotKeyActionUnmute         HotKeyAction = "unmute"
	HotKeyActionToggleMute     HotKeyAction = "toggle-mute"
	HotKeyActionIncreaseVolume HotKeyAction = "increase-volume"
	HotKeyActionDecreaseVolume HotKeyAction = "decrease-volume"
	HotKeyActionToggleEnabled  HotKeyAction = "toggle-enabled"
)

type HotKeyDeviceAction struct {
	Action HotKeyAction       `json:"action"`
	Device HotKeyTargetDevice `json:"target"`
	Value  string             `json:"value"`
}

type HotKeyHandler func(HotKeyDeviceAction) error

var registeredActions = map[HotKeyDeviceAction]HotKeyHandler{}

func RegisterHandler(action HotKeyDeviceAction, handler HotKeyHandler) {
	registeredActions[action] = handler
}

type ExecuteArg struct {
	Event    listenertypes.KeyEvent
	KeysDown []key.Key
}

// Execute executes a hot key action based on the keys down and the current keyboard event.
func (hk HotKeys) Execute(arg ExecuteArg) error {
	// Only execute hot keys on a key release event.
	if arg.Event.Action != listenertypes.ActionRelease {
		return nil
	}

	modifiersDown := lo.Filter(arg.KeysDown, func(k key.Key, _ int) bool {
		return lo.ContainsBy(hk, func(hkc HotKeyGroup) bool {
			return lo.Contains(hkc.Modifiers, k.Name) || lo.Contains(hkc.Modifiers, fmt.Sprintf("%d", k.Code))
		})
	})

	var (
		selectedHotKeyGroup *HotKeyGroup
		selectedHotKey      *HotKey
	)

findaction:
	for _, hkg := range hk {
		if len(hkg.Modifiers) != len(modifiersDown) {
			continue
		}

		for _, modifierDown := range modifiersDown {
			if !lo.Contains(hkg.Modifiers, modifierDown.Name) {
				continue
			}
		}

		for _, hotKey := range hkg.Keys {
			if hotKey.Key == arg.Event.Key.Name {
				selectedHotKeyGroup = &hkg
				selectedHotKey = &hotKey
				break findaction
			}
		}
	}

	if selectedHotKey == nil {
		return nil
	}

	err := hk.runAction(selectedHotKey.Action)
	if err != nil {
		return err
	}

	for _, delegate := range hotKeyDelegates {
		go delegate(HotKeyEvent{
			Modifiers: selectedHotKeyGroup.Modifiers,
			Key:       selectedHotKey.Key,
			Action:    selectedHotKey.Action,
		})
	}

	return nil
}

func (hk HotKeys) runAction(action HotKeyDeviceAction) error {
	// Since the Value on the input action is a filled in string, it will not match the registered actions. So we need
	// to find the appropriate key.
	key, ok := lo.Find(lo.Keys(registeredActions), func(key HotKeyDeviceAction) bool {
		return key.Action == action.Action && key.Device == action.Device
	})

	handler, ok := registeredActions[key]
	if !ok {
		return fmt.Errorf("handler not found for action: %s", action.Action)
	}

	return handler(action)
}

type HotKeyEventDelegate func(event HotKeyEvent)

type HotKeyEvent struct {
	// The keys that are required for any of the handlers to be triggered.
	Modifiers []string
	// The key that is required for the handler to be triggered.
	Key string
	// The action that was performed.
	Action HotKeyDeviceAction
}

var hotKeyDelegates = []HotKeyEventDelegate{}

func RegisterDelegate(delegate HotKeyEventDelegate) {
	hotKeyDelegates = append(hotKeyDelegates, delegate)
}
