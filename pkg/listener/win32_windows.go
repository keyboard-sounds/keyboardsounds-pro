package listener

import (
	"syscall"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/listener/listenertypes"
)

const (
	// This is the event we will hook into in the Windows API.
	wh_mouse_ll int = 14
	// Mouse button message constants
	wm_lbuttondown = 0x0201
	wm_lbuttonup   = 0x0202
	wm_rbuttondown = 0x0204
	wm_rbuttonup   = 0x0205
	wm_mbuttondown = 0x0207
	wm_mbuttonup   = 0x0208

	// This is the event we will hook into in the Windows API.
	wh_keyboard_ll int = 13
	// llkhf_up is used to determine if a key event is an up or down event.
	llkhf_up = 0x00000080
	wm_quit  = 0x0012
)

type (
	hookFunc func(int, uintptr, uintptr) uintptr
	hHOOK    uintptr
	hWND     uintptr
	msg      struct {
		HWND    hWND
		Message uint32
		WPARAM  uintptr
		LPARAM  uintptr
		Time    uint32
		Pt      struct {
			X, Y int32
		}
	}
	kbdllhookstruct struct {
		VKCode      uint32
		ScanCode    uint32
		Flags       uint32
		Time        uint32
		DwExtraInfo uintptr
	}
	msdllhookstruct struct {
		Pt          struct{ X, Y int32 }
		MouseData   uint32
		Flags       uint32
		Time        uint32
		DwExtraInfo uintptr
	}
	mouseEventData struct {
		Message uint32
		Time    uint32
		Button  listenertypes.Button
		Action  listenertypes.Action
	}
)

var (
	user32                  = syscall.NewLazyDLL("user32.dll")
	procSetWindowsHookEx    = user32.NewProc("SetWindowsHookExW")
	procCallNextHookEx      = user32.NewProc("CallNextHookEx")
	procUnhookWindowsHookEx = user32.NewProc("UnhookWindowsHookEx")
	procGetMessageW         = user32.NewProc("GetMessageW")
	procTranslateMessage    = user32.NewProc("TranslateMessage")
	procDispatchMessageW    = user32.NewProc("DispatchMessageW")
	procPostThreadMessageW  = user32.NewProc("PostThreadMessageW")

	kernel32               = syscall.NewLazyDLL("kernel32.dll")
	procGetTickCount       = kernel32.NewProc("GetTickCount64")
	procGetCurrentThreadId = kernel32.NewProc("GetCurrentThreadId")
)
