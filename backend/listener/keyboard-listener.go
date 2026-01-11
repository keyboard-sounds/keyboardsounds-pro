package listener

import (
	"context"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener/listenertypes"
)

// KeyboardListener is an interface that represents a listener for keyboard events.
type KeyboardListener interface {
	// Listen starts the listener.
	Listen(ctx context.Context) error
	// Events returns a channel of key events.
	Events() chan listenertypes.KeyEvent
}
