//go:build darwin

package oskhelpers

/*
extern void darwin_osk_set_click_shows_app(int v);
*/
import "C"

// SetClickOverlayShowsApp enables click-to-show-main-window on the OSK overlay (except the close control).
func SetClickOverlayShowsApp(enabled bool) {
	v := C.int(0)
	if enabled {
		v = 1
	}
	C.darwin_osk_set_click_shows_app(v)
}
