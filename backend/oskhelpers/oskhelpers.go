package oskhelpers

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
