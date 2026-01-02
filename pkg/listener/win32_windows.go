package listener

import (
	"syscall"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/listener/listenertypes"
)

const (
	// This is the event we will hook into in the Windows API.
	WH_MOUSE_LL int = 14
	// Mouse button message constants
	WM_LBUTTONDOWN = 0x0201
	WM_LBUTTONUP   = 0x0202
	WM_RBUTTONDOWN = 0x0204
	WM_RBUTTONUP   = 0x0205
	WM_MBUTTONDOWN = 0x0207
	WM_MBUTTONUP   = 0x0208

	// This is the event we will hook into in the Windows API.
	WH_KEYBOARD_LL int = 13
	// LLKHF_UP is used to determine if a key event is an up or down event.
	LLKHF_UP = 0x00000080

	PM_NOREMOVE = 0x0000
	PM_REMOVE   = 0x0001
	PM_NOYIELD  = 0x0002
	WM_QUIT     = 0x0012
)

type (
	HookFunc func(int, uintptr, uintptr) uintptr
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
	kbDLLHOOKSTRUCT struct {
		VKCode      uint32
		ScanCode    uint32
		Flags       uint32
		Time        uint32
		DwExtraInfo uintptr
	}
	msDLLHOOKSTRUCT struct {
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
