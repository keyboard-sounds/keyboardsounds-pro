package listener

import (
	"context"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener/listenertypes"
)

// MouseListener is an interface that represents a listener for mouse button events.
type MouseListener interface {
	// Listen starts the listener.
	Listen(ctx context.Context) error
	// Events returns a channel of mouse button events.
	Events() chan listenertypes.ButtonEvent
}
