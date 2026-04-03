package oskhelpers

var overlayClickHandler func()

// RegisterOverlayClickHandler sets the callback invoked when the user clicks the OSK overlay
// to show the main window (macOS only). Safe to call with nil to clear.
func RegisterOverlayClickHandler(fn func()) {
	overlayClickHandler = fn
}
