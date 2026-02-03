package oskhelpers

import (
	"fmt"
	"math"
	"sync"
	"syscall"
	"time"
	"unsafe"
)

// Windows API constants
const (
	ws_ex_layered    = 0x00080000
	ws_ex_topmost    = 0x00000008
	ws_ex_toolwindow = 0x00000080
	ws_popup         = 0x80000000

	sw_show = 5
	sw_hide = 0

	dt_center     = 0x00000001
	dt_vcenter    = 0x00000004
	dt_singleline = 0x00000020

	transparent = 1
)

var (
	user32   = syscall.NewLazyDLL("user32.dll")
	gdi32    = syscall.NewLazyDLL("gdi32.dll")
	kernel32 = syscall.NewLazyDLL("kernel32.dll")

	procCreateWindowEx       = user32.NewProc("CreateWindowExW")
	procDefWindowProc        = user32.NewProc("DefWindowProcW")
	procDestroyWindow        = user32.NewProc("DestroyWindow")
	procRegisterClassEx      = user32.NewProc("RegisterClassExW")
	procShowWindow           = user32.NewProc("ShowWindow")
	procUpdateWindow         = user32.NewProc("UpdateWindow")
	procGetDC                = user32.NewProc("GetDC")
	procReleaseDC            = user32.NewProc("ReleaseDC")
	procBeginPaint           = user32.NewProc("BeginPaint")
	procEndPaint             = user32.NewProc("EndPaint")
	procGetSystemMetrics     = user32.NewProc("GetSystemMetrics")
	procUpdateLayeredWindow  = user32.NewProc("UpdateLayeredWindow")
	procGetMessage           = user32.NewProc("GetMessageW")
	procTranslateMessage     = user32.NewProc("TranslateMessage")
	procDispatchMessage      = user32.NewProc("DispatchMessageW")
	procPostThreadMessage    = user32.NewProc("PostThreadMessageW")
	procGetCurrentThreadId   = kernel32.NewProc("GetCurrentThreadId")
	procGetModuleHandle      = kernel32.NewProc("GetModuleHandleW")
	procEnumDisplayMonitors  = user32.NewProc("EnumDisplayMonitors")
	procGetMonitorInfo       = user32.NewProc("GetMonitorInfoW")

	procSelectObject         = gdi32.NewProc("SelectObject")
	procSetBkMode            = gdi32.NewProc("SetBkMode")
	procSetTextColor         = gdi32.NewProc("SetTextColor")
	procDrawText             = user32.NewProc("DrawTextW")
	procCreateFont           = gdi32.NewProc("CreateFontW")
	procDeleteObject         = gdi32.NewProc("DeleteObject")
	procCreateCompatibleDC   = gdi32.NewProc("CreateCompatibleDC")
	procDeleteDC             = gdi32.NewProc("DeleteDC")
	procCreateDIBSection     = gdi32.NewProc("CreateDIBSection")
	procGetTextExtentPoint32 = gdi32.NewProc("GetTextExtentPoint32W")
	procSetWindowPos         = user32.NewProc("SetWindowPos")
)

type (
	hwnd   uintptr
	hdc    uintptr
	hbrush uintptr

	wndclassex struct {
		cbSize        uint32
		style         uint32
		lpfnWndProc   uintptr
		cbClsExtra    int32
		cbWndExtra    int32
		hInstance     syscall.Handle
		hIcon         uintptr
		hCursor       uintptr
		hbrBackground hbrush
		lpszMenuName  *uint16
		lpszClassName *uint16
		hIconSm       uintptr
	}

	point struct {
		x, y int32
	}

	msg struct {
		hwnd    hwnd
		message uint32
		wParam  uintptr
		lParam  uintptr
		time    uint32
		pt      point
	}

	rect struct {
		left   int32
		top    int32
		right  int32
		bottom int32
	}

	paintstruct struct {
		hdc         hdc
		fErase      int32
		rcPaint     rect
		fRestore    int32
		fIncUpdate  int32
		rgbReserved [32]byte
	}

	bitmapinfo struct {
		bmiHeader bitmapinfoheader
		bmiColors [1]uint32
	}

	bitmapinfoheader struct {
		biSize          uint32
		biWidth         int32
		biHeight        int32
		biPlanes        uint16
		biBitCount      uint16
		biCompression   uint32
		biSizeImage     uint32
		biXPelsPerMeter int32
		biYPelsPerMeter int32
		biClrUsed       uint32
		biClrImportant  uint32
	}

	blendfunction struct {
		BlendOp             byte
		BlendFlags          byte
		SourceConstantAlpha byte
		AlphaFormat         byte
	}

	pointl struct {
		x, y int32
	}

	size struct {
		cx, cy int32
	}

	sizeStruct struct {
		cx, cy int32
	}

	monitorinfo struct {
		cbSize    uint32
		rcMonitor rect
		rcWork    rect
		dwFlags   uint32
	}

	monitorData struct {
		monitors []monitorinfo
		index    int
	}
)

// monitorEnumProc is the callback for EnumDisplayMonitors
func monitorEnumProc(hMonitor uintptr, hdcMonitor uintptr, lprcMonitor uintptr, dwData uintptr) uintptr {
	data := (*monitorData)(unsafe.Pointer(dwData))
	
	var mi monitorinfo
	mi.cbSize = uint32(unsafe.Sizeof(mi))
	
	ret, _, _ := procGetMonitorInfo.Call(hMonitor, uintptr(unsafe.Pointer(&mi)))
	if ret != 0 {
		data.monitors = append(data.monitors, mi)
	}
	
	return 1 // Continue enumeration
}

// getMonitorInfo returns information about a specific monitor by index
// Returns nil if the monitor index is invalid
func getMonitorInfo(monitorIndex int) *monitorinfo {
	if monitorIndex < 0 {
		// Use primary monitor (index 0) for negative values
		monitorIndex = 0
	}
	
	data := monitorData{
		monitors: make([]monitorinfo, 0),
	}
	
	// Enumerate all monitors
	procEnumDisplayMonitors.Call(
		0, // hdc (NULL for all monitors)
		0, // lprcClip (NULL for all monitors)
		syscall.NewCallback(monitorEnumProc),
		uintptr(unsafe.Pointer(&data)),
	)
	
	// Find the primary monitor first
	primaryIdx := -1
	for i, monitor := range data.monitors {
		const monitorinfo_primary = 0x00000001
		if monitor.dwFlags&monitorinfo_primary != 0 {
			primaryIdx = i
			break
		}
	}
	
	// If requesting primary (index 0), return the primary monitor
	if monitorIndex == 0 && primaryIdx >= 0 {
		return &data.monitors[primaryIdx]
	}
	
	// For other indices, we need to order monitors consistently
	// Primary is always index 0, others follow
	if monitorIndex == 0 {
		// No primary found, return first monitor if available
		if len(data.monitors) > 0 {
			return &data.monitors[0]
		}
		return nil
	}
	
	// For non-primary monitors, skip the primary in our counting
	nonPrimaryIndex := 0
	for i := range data.monitors {
		if i == primaryIdx {
			continue // Skip primary
		}
		if nonPrimaryIndex == monitorIndex-1 {
			return &data.monitors[i]
		}
		nonPrimaryIndex++
	}
	
	// Index out of range, return primary as fallback
	if primaryIdx >= 0 {
		return &data.monitors[primaryIdx]
	}
	if len(data.monitors) > 0 {
		return &data.monitors[0]
	}
	return nil
}

// WindowsOSKHelper implements OSKHelper for Windows
type WindowsOSKHelper struct {
	hwnd         hwnd
	mutex        sync.Mutex
	text         string
	config       OSKHelperConfig
	threadID     uint32
	msgLoopDone  chan struct{}
	dismissTimer *time.Timer
}

// NewOSKHelper creates a new Windows OSK helper
func NewOSKHelper() (OSKHelper, error) {
	helper := &WindowsOSKHelper{
		msgLoopDone: make(chan struct{}),
	}

	// Create the overlay window in a separate goroutine
	errChan := make(chan error, 1)
	go helper.createWindow(errChan)

	// Wait for window creation to complete
	err := <-errChan
	if err != nil {
		return nil, err
	}

	return helper, nil
}

func (w *WindowsOSKHelper) createWindow(errChan chan error) {
	// Get the current thread ID for message loop
	ret, _, _ := procGetCurrentThreadId.Call()
	w.threadID = uint32(ret)

	className := syscall.StringToUTF16Ptr("OSKHelperWindow")

	// Get module handle
	hInstance, _, _ := procGetModuleHandle.Call(0)

	// Register window class
	const cs_hredraw = 0x0002
	const cs_vredraw = 0x0001
	wc := wndclassex{
		cbSize:        uint32(unsafe.Sizeof(wndclassex{})),
		style:         cs_hredraw | cs_vredraw,
		lpfnWndProc:   syscall.NewCallback(w.wndProc),
		hInstance:     syscall.Handle(hInstance),
		lpszClassName: className,
		hbrBackground: 0,
	}

	ret, _, err := procRegisterClassEx.Call(uintptr(unsafe.Pointer(&wc)))
	if ret == 0 {
		errChan <- fmt.Errorf("failed to register window class: %v", err)
		return
	}

	// Get screen dimensions
	smCxScreen := 0
	smCyScreen := 1
	screenWidth, _, _ := procGetSystemMetrics.Call(uintptr(smCxScreen))
	screenHeight, _, _ := procGetSystemMetrics.Call(uintptr(smCyScreen))

	// Window dimensions
	windowWidth := 600
	windowHeight := 80
	windowX := (int(screenWidth) - windowWidth) / 2
	windowY := int(screenHeight) - windowHeight - 50

	// Create the window
	hwndRet, _, _ := procCreateWindowEx.Call(
		ws_ex_layered|ws_ex_topmost|ws_ex_toolwindow,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr("OSK Helper"))),
		ws_popup,
		uintptr(windowX),
		uintptr(windowY),
		uintptr(windowWidth),
		uintptr(windowHeight),
		0,
		0,
		hInstance,
		0,
	)

	if hwndRet == 0 {
		errChan <- fmt.Errorf("failed to create window")
		return
	}

	w.hwnd = hwnd(hwndRet)

	// Don't show the window initially
	procShowWindow.Call(uintptr(w.hwnd), sw_hide)

	errChan <- nil

	// Message loop
	var m msg
	for {
		ret, _, _ := procGetMessage.Call(
			uintptr(unsafe.Pointer(&m)),
			0,
			0,
			0,
		)
		if ret == 0 {
			break
		}

		procTranslateMessage.Call(uintptr(unsafe.Pointer(&m)))
		procDispatchMessage.Call(uintptr(unsafe.Pointer(&m)))
	}

	close(w.msgLoopDone)
}

// Window procedure callback
func (w *WindowsOSKHelper) wndProc(hwnd hwnd, msg uint32, wParam, lParam uintptr) uintptr {
	const (
		wm_paint   = 0x000F
		wm_destroy = 0x0002
		wm_close   = 0x0010
	)

	switch msg {
	case wm_paint:
		w.onPaint(hwnd)
		return 0
	case wm_close, wm_destroy:
		return 0
	default:
		ret, _, _ := procDefWindowProc.Call(uintptr(hwnd), uintptr(msg), wParam, lParam)
		return ret
	}
}

func (w *WindowsOSKHelper) onPaint(hwnd hwnd) {
	var ps paintstruct
	hdc, _, _ := procBeginPaint.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&ps)))
	if hdc == 0 {
		return
	}
	defer procEndPaint.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&ps)))

	w.mutex.Lock()
	text := w.text
	w.mutex.Unlock()

	if text == "" {
		return
	}

	// Update the layered window with per-pixel alpha
	w.updateLayeredWindowContent()
}

func (w *WindowsOSKHelper) updateLayeredWindowContent() {
	w.mutex.Lock()
	text := w.text
	config := w.config
	w.mutex.Unlock()

	// Get font size (default to 28 if not specified or invalid)
	fontSize := config.FontSize
	if fontSize <= 0 {
		fontSize = 28
	}

	// Create a temporary DC to measure text
	screenDC, _, _ := procGetDC.Call(0)
	if screenDC == 0 {
		return
	}
	defer procReleaseDC.Call(0, screenDC)

	tempDC, _, _ := procCreateCompatibleDC.Call(screenDC)
	if tempDC == 0 {
		return
	}
	defer procDeleteDC.Call(tempDC)

	// Create font for measurement
	font, _, _ := procCreateFont.Call(
		uintptr(fontSize), // height
		0,                 // width
		0,                 // escapement
		0,                 // orientation
		700,               // weight (bold)
		0,                 // italic
		0,                 // underline
		0,                 // strikeout
		1,                 // charset (DEFAULT_CHARSET)
		0,                 // output precision
		0,                 // clip precision
		5,                 // quality (CLEARTYPE_QUALITY)
		0,                 // pitch and family
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr("Segoe UI"))),
	)
	if font == 0 {
		return
	}
	defer procDeleteObject.Call(font)

	oldFont, _, _ := procSelectObject.Call(tempDC, font)
	defer procSelectObject.Call(tempDC, oldFont)

	// Measure text dimensions
	textPtr := syscall.StringToUTF16Ptr(text)
	var textSize sizeStruct
	ret, _, _ := procGetTextExtentPoint32.Call(
		tempDC,
		uintptr(unsafe.Pointer(textPtr)),
		uintptr(len(syscall.StringToUTF16(text))-1), // Length without null terminator
		uintptr(unsafe.Pointer(&textSize)),
	)
	if ret == 0 {
		// Fallback to reasonable defaults if measurement fails
		textSize.cx = 300
		textSize.cy = int32(fontSize)
	}

	// Calculate window dimensions with 16px padding on each side
	const padding = 16
	windowWidth := int(textSize.cx) + (padding * 2)
	windowHeight := int(textSize.cy) + (padding * 2)

	// Ensure minimum dimensions
	if windowWidth < 100 {
		windowWidth = 100
	}
	if windowHeight < 40 {
		windowHeight = 40
	}

	// Get monitor dimensions for positioning
	var screenX, screenY, screenWidth, screenHeight int
	
	monitorInfo := getMonitorInfo(config.MonitorIndex)
	if monitorInfo != nil {
		// Use the work area (excludes taskbar) of the selected monitor
		screenX = int(monitorInfo.rcWork.left)
		screenY = int(monitorInfo.rcWork.top)
		screenWidth = int(monitorInfo.rcWork.right - monitorInfo.rcWork.left)
		screenHeight = int(monitorInfo.rcWork.bottom - monitorInfo.rcWork.top)
	} else {
		// Fallback to primary monitor using GetSystemMetrics
		smCxScreen := 0
		smCyScreen := 1
		screenX = 0
		screenY = 0
		w, _, _ := procGetSystemMetrics.Call(uintptr(smCxScreen))
		h, _, _ := procGetSystemMetrics.Call(uintptr(smCyScreen))
		screenWidth = int(w)
		screenHeight = int(h)
	}

	// Calculate centered horizontal position within the monitor
	windowX := screenX + (screenWidth-windowWidth)/2

	// Calculate vertical position based on Position and Offset
	offset := config.Offset
	if offset < 0 {
		offset = 0 // Don't allow negative offset
	}

	var windowY int
	if config.Position == OSKPositionTop {
		// Top of screen: offset from top edge
		windowY = screenY + offset
	} else {
		// Bottom of screen (default): offset from bottom edge
		windowY = screenY + screenHeight - windowHeight - offset
	}

	// Update window position and size
	const (
		swp_noactivate = 0x0010
		swp_nozorder   = 0x0004
	)
	procSetWindowPos.Call(
		uintptr(w.hwnd),
		0,
		uintptr(windowX),
		uintptr(windowY),
		uintptr(windowWidth),
		uintptr(windowHeight),
		swp_nozorder|swp_noactivate,
	)

	// Create memory DC (reuse screenDC from above)
	memDC, _, _ := procCreateCompatibleDC.Call(screenDC)
	if memDC == 0 {
		return
	}
	defer procDeleteDC.Call(memDC)

	// Create DIB section with 32-bit ARGB format
	var bi bitmapinfo
	bi.bmiHeader.biSize = uint32(unsafe.Sizeof(bi.bmiHeader))
	bi.bmiHeader.biWidth = int32(windowWidth)
	bi.bmiHeader.biHeight = -int32(windowHeight) // Negative for top-down DIB
	bi.bmiHeader.biPlanes = 1
	bi.bmiHeader.biBitCount = 32
	bi.bmiHeader.biCompression = 0 // BI_RGB

	var pBits uintptr
	hBitmap, _, _ := procCreateDIBSection.Call(
		memDC,
		uintptr(unsafe.Pointer(&bi)),
		0, // DIB_RGB_COLORS
		uintptr(unsafe.Pointer(&pBits)),
		0,
		0,
	)
	if hBitmap == 0 {
		return
	}
	defer procDeleteObject.Call(hBitmap)

	// Select bitmap into memory DC
	oldBitmap, _, _ := procSelectObject.Call(memDC, hBitmap)
	defer procSelectObject.Call(memDC, oldBitmap)

	// Fill bitmap with background color and alpha
	bgColor := parseHexColor(config.BackgroundColor, 0x1E1E1E)
	bgOpacity := config.BackgroundOpacity
	if bgOpacity < 0 || bgOpacity > 255 {
		bgOpacity = 220
	}

	// Pre-multiply alpha (required for per-pixel alpha blending)
	bgR := byte((bgColor >> 0) & 0xFF)
	bgG := byte((bgColor >> 8) & 0xFF)
	bgB := byte((bgColor >> 16) & 0xFF)

	// Pre-multiply RGB by alpha
	alphaf := float32(bgOpacity) / 255.0
	bgRPre := byte(float32(bgR) * alphaf)
	bgGPre := byte(float32(bgG) * alphaf)
	bgBPre := byte(float32(bgB) * alphaf)

	bgColorARGB := uint32(bgOpacity)<<24 | uint32(bgBPre)<<16 | uint32(bgGPre)<<8 | uint32(bgRPre)

	// Get corner radius from config
	cornerRadius := max(config.CornerRadius, 0)

	// Fill the bitmap with rounded corners
	pixels := unsafe.Slice((*uint32)(unsafe.Pointer(pBits)), windowWidth*windowHeight)
	for y := 0; y < windowHeight; y++ {
		for x := 0; x < windowWidth; x++ {
			i := y*windowWidth + x

			// Calculate alpha multiplier for rounded corners
			cornerAlpha := getCornerAlpha(x, y, windowWidth, windowHeight, cornerRadius)

			if cornerAlpha <= 0.0 {
				// Pixel is outside rounded corner - fully transparent
				pixels[i] = 0
			} else if cornerAlpha < 1.0 {
				// Anti-aliasing edge - blend alpha
				adjustedOpacity := byte(float32(bgOpacity) * cornerAlpha)
				adjustedRPre := byte(float32(bgRPre) * cornerAlpha)
				adjustedGPre := byte(float32(bgGPre) * cornerAlpha)
				adjustedBPre := byte(float32(bgBPre) * cornerAlpha)
				pixels[i] = uint32(adjustedOpacity)<<24 | uint32(adjustedBPre)<<16 | uint32(adjustedGPre)<<8 | uint32(adjustedRPre)
			} else {
				// Normal pixel - full background color
				pixels[i] = bgColorARGB
			}
		}
	}

	// Select the font we already created (reuse it)
	oldFont2, _, _ := procSelectObject.Call(memDC, font)
	defer procSelectObject.Call(memDC, oldFont2)

	// Parse font color (default to white, fully opaque)
	fontColor := parseHexColor(config.FontColor, 0xFFFFFF)

	// Set text properties
	procSetBkMode.Call(memDC, transparent)
	procSetTextColor.Call(memDC, uintptr(fontColor))

	// Draw text centered
	var textRect rect
	textRect.left = 0
	textRect.top = 0
	textRect.right = int32(windowWidth)
	textRect.bottom = int32(windowHeight)

	// textPtr already defined above for measurement
	procDrawText.Call(
		memDC,
		uintptr(unsafe.Pointer(textPtr)),
		uintptr(^uint(0)), // -1 means null-terminated string
		uintptr(unsafe.Pointer(&textRect)),
		dt_center|dt_vcenter|dt_singleline,
	)

	// Post-process pixels to ensure text has full alpha
	// GDI doesn't properly handle alpha for text, so we fix it
	for i := range pixels {
		pixel := pixels[i]
		// If pixel is different from background, set alpha to 255
		if pixel != bgColorARGB && (pixel&0x00FFFFFF) != 0 {
			rgb := pixel & 0x00FFFFFF
			// Get RGB components
			r := byte(rgb & 0xFF)
			g := byte((rgb >> 8) & 0xFF)
			b := byte((rgb >> 16) & 0xFF)
			// Set to full opacity with pre-multiplied alpha
			pixels[i] = 0xFF000000 | (uint32(b) << 16) | (uint32(g) << 8) | uint32(r)
		}
	}

	// Update the layered window
	const ulw_alpha = 0x00000002
	const ac_src_over = 0x00
	const ac_src_alpha = 0x01

	var ptSrc pointl
	var sizeWnd size
	sizeWnd.cx = int32(windowWidth)
	sizeWnd.cy = int32(windowHeight)

	blend := blendfunction{
		BlendOp:             ac_src_over,
		BlendFlags:          0,
		SourceConstantAlpha: 255,
		AlphaFormat:         ac_src_alpha,
	}

	procUpdateLayeredWindow.Call(
		uintptr(w.hwnd),
		0, // hdcDst (use screen DC)
		0, // pptDst (keep current position)
		uintptr(unsafe.Pointer(&sizeWnd)),
		memDC,
		uintptr(unsafe.Pointer(&ptSrc)),
		0, // crKey
		uintptr(unsafe.Pointer(&blend)),
		ulw_alpha,
	)
}

// parseHexColor converts a hex color string (e.g., "#FFFFFF" or "FFFFFF") to Windows COLORREF (BGR format)
func parseHexColor(hexColor string, defaultColor uint32) uint32 {
	// Remove '#' if present
	if len(hexColor) > 0 && hexColor[0] == '#' {
		hexColor = hexColor[1:]
	}

	// Parse hex string
	if len(hexColor) != 6 {
		return defaultColor
	}

	var r, g, b uint32
	_, err := fmt.Sscanf(hexColor, "%02x%02x%02x", &r, &g, &b)
	if err != nil {
		return defaultColor
	}

	// Windows COLORREF is in BGR format: 0x00BBGGRR
	return (b << 16) | (g << 8) | r
}

// getCornerAlpha calculates the alpha multiplier for rounded corners with anti-aliasing
// Returns 0.0 (transparent) to 1.0 (opaque)
func getCornerAlpha(x, y, width, height, radius int) float32 {
	if radius <= 0 {
		return 1.0
	}

	// Check if pixel is in a corner region
	var cornerX, cornerY int
	inCorner := false

	// Top-left corner
	if x < radius && y < radius {
		cornerX = radius
		cornerY = radius
		inCorner = true
	}
	// Top-right corner
	if x >= width-radius && y < radius {
		cornerX = width - radius - 1
		cornerY = radius
		inCorner = true
	}
	// Bottom-left corner
	if x < radius && y >= height-radius {
		cornerX = radius
		cornerY = height - radius - 1
		inCorner = true
	}
	// Bottom-right corner
	if x >= width-radius && y >= height-radius {
		cornerX = width - radius - 1
		cornerY = height - radius - 1
		inCorner = true
	}

	if !inCorner {
		return 1.0
	}

	// Calculate distance from corner center
	dx := float32(x - cornerX)
	dy := float32(y - cornerY)
	distance := float32(0)
	if dx != 0 || dy != 0 {
		distance = float32(math.Sqrt(float64(dx*dx + dy*dy)))
	}

	radiusF := float32(radius)

	// Pixel is outside the rounded corner
	if distance > radiusF {
		return 0.0
	}

	// Anti-aliasing: smooth transition in the last pixel
	if distance > radiusF-1.0 {
		return radiusF - distance
	}

	return 1.0
}

// SetOnScreenText displays text on the screen with the given configuration
func (w *WindowsOSKHelper) SetOnScreenText(config OSKHelperConfig, text string) error {
	w.mutex.Lock()

	// Cancel any pending dismissal timer
	if w.dismissTimer != nil {
		w.dismissTimer.Stop()
		w.dismissTimer = nil
	}

	w.text = text
	w.config = config
	w.mutex.Unlock()

	if text == "" {
		return w.ClearOnScreenText()
	}

	// Update the layered window with per-pixel alpha
	w.updateLayeredWindowContent()

	// Show the window
	procShowWindow.Call(uintptr(w.hwnd), sw_show)

	return nil
}

// ClearOnScreenText hides the on-screen text after the configured delay
func (w *WindowsOSKHelper) ClearOnScreenText() error {
	w.mutex.Lock()

	// Get the dismiss delay from config
	dismissAfter := w.config.DismissAfter

	// Cancel any existing timer
	if w.dismissTimer != nil {
		w.dismissTimer.Stop()
		w.dismissTimer = nil
	}

	// If no delay is configured, hide immediately
	if dismissAfter <= 0 {
		w.text = ""
		w.mutex.Unlock()

		procShowWindow.Call(uintptr(w.hwnd), sw_hide)
		procUpdateWindow.Call(uintptr(w.hwnd))

		return nil
	}

	// Create a timer to hide after the delay
	w.dismissTimer = time.AfterFunc(dismissAfter, func() {
		w.mutex.Lock()
		w.text = ""
		w.dismissTimer = nil
		w.mutex.Unlock()

		procShowWindow.Call(uintptr(w.hwnd), sw_hide)
		procUpdateWindow.Call(uintptr(w.hwnd))
	})

	w.mutex.Unlock()

	return nil
}

// MonitorInfo represents information about a display monitor
type MonitorInfo struct {
	Index     int    `json:"index"`
	IsPrimary bool   `json:"isPrimary"`
	Left      int    `json:"left"`
	Top       int    `json:"top"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
}

// GetMonitors returns information about all available monitors
func GetMonitors() []MonitorInfo {
	data := monitorData{
		monitors: make([]monitorinfo, 0),
	}
	
	// Enumerate all monitors
	procEnumDisplayMonitors.Call(
		0, // hdc (NULL for all monitors)
		0, // lprcClip (NULL for all monitors)
		syscall.NewCallback(monitorEnumProc),
		uintptr(unsafe.Pointer(&data)),
	)
	
	if len(data.monitors) == 0 {
		return []MonitorInfo{}
	}
	
	// Find primary monitor
	primaryIdx := -1
	for i, monitor := range data.monitors {
		const monitorinfo_primary = 0x00000001
		if monitor.dwFlags&monitorinfo_primary != 0 {
			primaryIdx = i
			break
		}
	}
	
	result := make([]MonitorInfo, 0)
	
	// Add primary monitor first (index 0)
	if primaryIdx >= 0 {
		monitor := data.monitors[primaryIdx]
		result = append(result, MonitorInfo{
			Index:     0,
			IsPrimary: true,
			Left:      int(monitor.rcWork.left),
			Top:       int(monitor.rcWork.top),
			Width:     int(monitor.rcWork.right - monitor.rcWork.left),
			Height:    int(monitor.rcWork.bottom - monitor.rcWork.top),
		})
	}
	
	// Add other monitors
	for i, monitor := range data.monitors {
		if i == primaryIdx {
			continue // Skip primary, already added
		}
		result = append(result, MonitorInfo{
			Index:     len(result),
			IsPrimary: false,
			Left:      int(monitor.rcWork.left),
			Top:       int(monitor.rcWork.top),
			Width:     int(monitor.rcWork.right - monitor.rcWork.left),
			Height:    int(monitor.rcWork.bottom - monitor.rcWork.top),
		})
	}
	
	return result
}

// Close cleans up the window (optional, for graceful shutdown)
func (w *WindowsOSKHelper) Close() error {
	w.mutex.Lock()
	// Cancel any pending dismissal timer
	if w.dismissTimer != nil {
		w.dismissTimer.Stop()
		w.dismissTimer = nil
	}
	w.mutex.Unlock()

	if w.hwnd != 0 {
		// Post quit message to the message loop
		const wm_quit = 0x0012
		procPostThreadMessage.Call(
			uintptr(w.threadID),
			wm_quit,
			0,
			0,
		)

		// Wait for message loop to finish
		<-w.msgLoopDone

		procDestroyWindow.Call(uintptr(w.hwnd))
		w.hwnd = 0
	}
	return nil
}
