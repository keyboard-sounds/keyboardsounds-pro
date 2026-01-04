package listenertypes

import "time"

// Button represents a button on a mouse.
type Button string

const (
	// ButtonLeft represents the left button on a mouse.
	ButtonLeft Button = "left"
	// ButtonRight represents the right button on a mouse.
	ButtonRight Button = "right"
	// ButtonMiddle represents the middle button on a mouse.
	ButtonMiddle Button = "middle"
)

// ButtonEvent represents a button event.
type ButtonEvent struct {
	// Device that generated the event.
	Device *Device
	// Button that was pressed or released.
	Button Button
	// Action that was performed (press or release).
	Action Action
	// Timestamp of the event.
	Timestamp time.Time
}
