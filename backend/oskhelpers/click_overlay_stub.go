//go:build !darwin

package oskhelpers

// SetClickOverlayShowsApp is a no-op on non-macOS platforms.
func SetClickOverlayShowsApp(enabled bool) {
	_ = enabled
}
