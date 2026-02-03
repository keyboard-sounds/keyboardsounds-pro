package oskhelpers

import "time"

type OSKPosition string

const (
	OSKPositionBottom OSKPosition = "bottom"
	OSKPositionTop    OSKPosition = "top"
)

type OSKHelperConfig struct {
	FontSize int
	// Hex color code for font color. (e.g. "#FFFFFF")
	FontColor string
	// Hex color code for background color (e.g. "#FFFFFF")
	BackgroundColor string
	// Background opacity (0-255)
	BackgroundOpacity int
	// Corner Radius of the window in pixels.
	CornerRadius int
	// Position is the position of the OSK on the screen.
	Position OSKPosition
	// Offset is the offset of the OSK from the position in pixels.
	Offset int
	// DismissAfter is the duration after which the OSK will be dismissed.
	DismissAfter time.Duration
	// MonitorIndex specifies which monitor to display on (0 = primary, 1+ = additional monitors, -1 = auto/current)
	MonitorIndex int
}

type OSKHelper interface {
	// SetOnScreenText will set the text visible on the bottom of the users screen.
	SetOnScreenText(OSKHelperConfig, string) error
	// ClearOnScreenText will clear the text visible on the bottom of the users screen.
	ClearOnScreenText() error
}

// New creates a new OSKHelper instance for the current platform.
// Returns an error if the platform is not supported or initialization fails.
func New() (OSKHelper, error) {
	return NewOSKHelper()
}
