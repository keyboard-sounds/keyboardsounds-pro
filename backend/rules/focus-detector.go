package rules

import "context"

// FocusEvent is an event that is emitted when the focus of the application changes.
type FocusEvent struct {
	// Executable is the path to the executable that gained focus.
	Executable string
}

// FocusDetector is an interface that represents a focus detector.
type FocusDetector interface {
	// Listen starts the focus detector.
	Listen(ctx context.Context) error
	// Events returns a channel that emits focus events.
	Events() chan FocusEvent
}
