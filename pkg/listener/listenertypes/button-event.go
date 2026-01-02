package listenertypes

import "time"

type Button string

const (
	ButtonLeft   Button = "left"
	ButtonRight  Button = "right"
	ButtonMiddle Button = "middle"
)

type ButtonEvent struct {
	// The device that generated the event.
	Device *Device
	// The button that was pressed or released.
	Button Button
	// The action that was performed (press or release).
	Action Action
	// The timestamp of the event.
	Timestamp time.Time
}
