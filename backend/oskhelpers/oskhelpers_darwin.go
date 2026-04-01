//go:build darwin

package oskhelpers

/*
#cgo LDFLAGS: -framework ApplicationServices -framework CoreGraphics -framework Foundation

#include <CoreGraphics/CoreGraphics.h>
#include <stdlib.h>

// Panel functions are implemented in oskhelpers_darwin_panel.go
extern void darwin_osk_create(void);
extern void darwin_osk_run_iteration(void);
extern void darwin_osk_show_dispatch(int fontSize, double fontR, double fontG, double fontB,
                                     double bgR, double bgG, double bgB, double bgAlpha, int cornerRadius,
                                     int positionBottom, int offset, int monitorIndex, int width, int height);
extern void darwin_osk_hide(void);
extern void darwin_osk_hide_now(void);  // hide panel immediately (must be called from main thread)
extern void darwin_osk_force_dismiss(void);

// getDisplayList fills displayIDs with up to maxDisplays active display IDs, returns count.
static int getDisplayList(uint32_t maxDisplays, uint32_t *displayIDs) {
	uint32_t count = 0;
	CGError err = CGGetActiveDisplayList(maxDisplays, (CGDirectDisplayID *)displayIDs, &count);
	return (err == kCGErrorSuccess) ? (int)count : 0;
}

static uint32_t getMainDisplayID(void) {
	return (uint32_t)CGMainDisplayID();
}

static void getDisplayBounds(uint32_t displayID, int *x, int *y, int *w, int *h) {
	CGRect r = CGDisplayBounds((CGDirectDisplayID)displayID);
	*x = (int)CGRectGetMinX(r);
	*y = (int)CGRectGetMinY(r);
	*w = (int)CGRectGetWidth(r);
	*h = (int)CGRectGetHeight(r);
}
*/
import "C"

import (
	"log/slog"
	"strconv"
	"strings"
	"sync"
	"time"
	"unsafe"
)

// Pending OSK show text queue so the main-thread block gets the exact string we set (avoids C copy/async issues).
var (
	pendingOSKTexts   []string
	pendingOSKTextsMu sync.Mutex
)

func getMonitorsDarwin() []MonitorInfo {
	const maxDisplays = 32
	displayIDs := make([]C.uint32_t, maxDisplays)
	n := C.getDisplayList(maxDisplays, (*C.uint32_t)(unsafe.Pointer(&displayIDs[0])))
	if n <= 0 {
		return []MonitorInfo{}
	}
	mainID := C.getMainDisplayID()
	var result []MonitorInfo
	for i := 0; i < int(n); i++ {
		id := uint32(displayIDs[i])
		var x, y, w, h C.int
		C.getDisplayBounds(C.uint32_t(id), &x, &y, &w, &h)
		result = append(result, MonitorInfo{
			Index:     i,
			IsPrimary: id == uint32(mainID),
			Left:      int(x),
			Top:       int(y),
			Width:     int(w),
			Height:    int(h),
		})
	}
	// Sort so primary is index 0 to match Windows behavior
	for i, m := range result {
		if m.IsPrimary && i != 0 {
			result[0], result[i] = result[i], result[0]
			result[0].Index = 0
			result[i].Index = i
			break
		}
	}
	return result
}

// darwinOSKHelper implements OSKHelper on macOS using AppKit (NSPanel).
// The actual window is created and run on a dedicated thread via Objective-C.
type darwinOSKHelper struct {
	mu           sync.Mutex
	config       OSKHelperConfig
	text         string
	dismissTimer *time.Timer
	// onForceDismiss is called when the user dismisses the overlay (stored for C callback).
	onForceDismiss func()
}

var (
	darwinOSKHelperMu     sync.Mutex
	darwinOSKHelperGlobal *darwinOSKHelper
)

func newOSKHelper() (OSKHelper, error) {
	// Panel is created lazily on first show inside doShow (on the main queue) so it is always on the main thread.
	// Caller must invoke RunMainLoop() from the main goroutine so the Cocoa run loop runs on the main thread.
	h := &darwinOSKHelper{}
	darwinOSKHelperMu.Lock()
	darwinOSKHelperGlobal = h
	darwinOSKHelperMu.Unlock()
	return h, nil
}

// RunMainLoop runs the Cocoa main run loop and blocks forever. On macOS, any app that uses the OSK helper
// must call RunMainLoop() from the main goroutine (e.g. at the end of main()), so that dispatch_get_main_queue
// is serviced and SetOnScreenText from other goroutines (e.g. keyboard events) actually shows the overlay.
//
// We run the run loop in short iterations (CFRunLoopRunInMode with 50ms timeout) instead of one long
// [NSApp run] CGO call to avoid SIGTRAP "signal arrived during cgo execution" on macOS (see golang.org/issue/57263).
func RunMainLoop() {
	for {
		C.darwin_osk_run_iteration()
	}
}

// oskForceDismissCallback is called from Objective-C when the user clicks the close button.
// We hide the panel immediately (we're on the main thread) and then run the delegate.
//
//export oskForceDismissCallback
func oskForceDismissCallback() {
	slog.Info("OSK: close button callback invoked")
	darwinOSKHelperMu.Lock()
	h := darwinOSKHelperGlobal
	darwinOSKHelperMu.Unlock()
	if h == nil {
		slog.Info("OSK: close callback skipped (no helper)")
		return
	}
	// Hide panel now (called from main thread from the button action).
	C.darwin_osk_hide_now()
	h.mu.Lock()
	if h.dismissTimer != nil {
		h.dismissTimer.Stop()
		h.dismissTimer = nil
	}
	cb := h.onForceDismiss
	h.mu.Unlock()
	if cb != nil {
		cb()
	}
}

func (d *darwinOSKHelper) SetOnScreenText(config OSKHelperConfig, text string) error {
	text = strings.ReplaceAll(text, "LeftWin", "⌘")
	text = strings.ReplaceAll(text, "RightWin", "⌘")
	text = strings.ReplaceAll(text, "LeftAlt", "⌥")
	text = strings.ReplaceAll(text, "RightAlt", "⌥")

	d.mu.Lock()
	if d.dismissTimer != nil {
		d.dismissTimer.Stop()
		d.dismissTimer = nil
	}
	d.config = config
	d.text = text
	d.onForceDismiss = config.OnForceDismiss
	d.mu.Unlock()

	if text == "" {
		return d.ClearOnScreenText()
	}
	if err := darwinOSKShow(d, config, text); err != nil {
		return err
	}
	// Start auto-dismiss timer when DismissAfter is set (match Windows behavior).
	if config.DismissAfter > 0 {
		d.mu.Lock()
		d.dismissTimer = time.AfterFunc(config.DismissAfter, func() {
			darwinOSKHide()
		})
		d.mu.Unlock()
	}
	return nil
}

func (d *darwinOSKHelper) ClearOnScreenText() error {
	d.mu.Lock()
	dismissAfter := d.config.DismissAfter
	if d.dismissTimer != nil {
		d.dismissTimer.Stop()
		d.dismissTimer = nil
	}
	d.mu.Unlock()

	if dismissAfter <= 0 {
		darwinOSKHide()
		return nil
	}
	d.dismissTimer = time.AfterFunc(dismissAfter, func() {
		darwinOSKHide()
	})
	return nil
}

func (d *darwinOSKHelper) ForceDismiss() error {
	d.mu.Lock()
	if d.dismissTimer != nil {
		d.dismissTimer.Stop()
		d.dismissTimer = nil
	}
	cb := d.onForceDismiss
	d.mu.Unlock()

	darwinOSKForceDismiss()
	if cb != nil {
		cb()
	}
	return nil
}

// GetMonitors returns information about all displays (Darwin implementation).
func GetMonitors() []MonitorInfo {
	return getMonitorsDarwin()
}

func parseHexColor(hex string) (r, g, b float64) {
	if len(hex) > 0 && hex[0] == '#' {
		hex = hex[1:]
	}
	if len(hex) != 6 {
		return 1, 1, 1
	}
	rr, _ := strconv.ParseUint(hex[0:2], 16, 8)
	gg, _ := strconv.ParseUint(hex[2:4], 16, 8)
	bb, _ := strconv.ParseUint(hex[4:6], 16, 8)
	return float64(rr) / 255, float64(gg) / 255, float64(bb) / 255
}

func darwinOSKShow(h *darwinOSKHelper, config OSKHelperConfig, text string) error {
	fontSize := config.FontSize
	if fontSize <= 0 {
		fontSize = 28
	}
	fr, fg, fb := parseHexColor(config.FontColor)
	br, bg, bb := parseHexColor(config.BackgroundColor)
	bgAlpha := float64(config.BackgroundOpacity) / 255
	if bgAlpha <= 0 || bgAlpha > 1 {
		bgAlpha = 0.86
	}
	cornerRadius := config.CornerRadius
	if cornerRadius < 0 {
		cornerRadius = 8
	}
	positionBottom := 1
	if config.Position == OSKPositionTop {
		positionBottom = 0
	}
	offset := config.Offset
	if offset < 0 {
		offset = 50
	}
	monitorIndex := config.MonitorIndex
	if monitorIndex < 0 {
		monitorIndex = 0
	}
	width, height := 400, 60
	// Queue text so the main-thread block retrieves it from Go (avoids C string copy/async truncation).
	pendingOSKTextsMu.Lock()
	pendingOSKTexts = append(pendingOSKTexts, text)
	pendingOSKTextsMu.Unlock()
	C.darwin_osk_show_dispatch(C.int(fontSize),
		C.double(fr), C.double(fg), C.double(fb),
		C.double(br), C.double(bg), C.double(bb), C.double(bgAlpha),
		C.int(cornerRadius), C.int(positionBottom), C.int(offset), C.int(monitorIndex),
		C.int(width), C.int(height))
	return nil
}

// darwin_osk_get_next_show_text is called from C (main thread) to get the next queued text. Copies into buf, returns length.
//
//export darwin_osk_get_next_show_text
func darwin_osk_get_next_show_text(buf *C.char, bufSize C.size_t) C.size_t {
	if buf == nil || bufSize == 0 {
		return 0
	}
	pendingOSKTextsMu.Lock()
	if len(pendingOSKTexts) == 0 {
		pendingOSKTextsMu.Unlock()
		return 0
	}
	text := pendingOSKTexts[0]
	pendingOSKTexts = pendingOSKTexts[1:]
	pendingOSKTextsMu.Unlock()
	n := len(text)
	if n > int(bufSize)-1 {
		n = int(bufSize) - 1
	}
	for i := 0; i < n; i++ {
		*(*byte)(unsafe.Pointer(uintptr(unsafe.Pointer(buf)) + uintptr(i))) = text[i]
	}
	*(*byte)(unsafe.Pointer(uintptr(unsafe.Pointer(buf)) + uintptr(n))) = 0
	return C.size_t(n)
}

func darwinOSKHide() {
	C.darwin_osk_hide()
}

func darwinOSKForceDismiss() {
	C.darwin_osk_force_dismiss()
}

// oskClickShowAppCallback is invoked from AppKit when the user clicks the overlay (not the close button).
//
//export oskClickShowAppCallback
func oskClickShowAppCallback() {
	if overlayClickHandler != nil {
		overlayClickHandler()
	}
}
