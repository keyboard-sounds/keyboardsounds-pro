package listenertypes

// Action represents an action that was performed on a key.
type Action string

const (
	// ActionPress represents a key press event.
	ActionPress Action = "press"
	// ActionRelease represents a key release event.
	ActionRelease Action = "release"
)
