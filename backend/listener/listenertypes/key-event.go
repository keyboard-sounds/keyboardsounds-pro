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
}
