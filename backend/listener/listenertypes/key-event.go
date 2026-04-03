package listenertypes

import (
	"time"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/key"
)

// KeyEvent represents a key event.
type KeyEvent struct {
	// The device that generated the event.
	Device *Device
	// The key that was pressed or released.
	Key key.Key
	// The action that was performed (press or release).
	Action Action
	// The timestamp of the event.
	Timestamp time.Time
	// ModifierKeys are modifier keys that were held when this event occurred (from event flags).
	// Used when the platform does not deliver separate key events for modifiers (e.g. Ctrl+A only sends A).
	// If nil, only key-events-derived state is used.
	ModifierKeys []key.Key
}
