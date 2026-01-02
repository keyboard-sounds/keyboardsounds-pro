package rules

import (
	"context"
	"fmt"
	"log/slog"
	"runtime"
	"sync"
	"syscall"
	"unsafe"
)

const (
	PROCESS_QUERY_INFORMATION = 0x0400
	PROCESS_VM_READ           = 0x0010
	WINEVENT_OUTOFCONTEXT     = 0x0000
	EVENT_SYSTEM_FOREGROUND   = 0x0003
	WM_QUIT                   = 0x0012
)

var (
	user32                       = syscall.NewLazyDLL("user32.dll")
	procSetWinEventHook          = user32.NewProc("SetWinEventHook")
	procUnhookWinEvent           = user32.NewProc("UnhookWinEvent")
	procGetForegroundWindow      = user32.NewProc("GetForegroundWindow")
	procGetWindowThreadProcessId = user32.NewProc("GetWindowThreadProcessId")
	procGetMessageW              = user32.NewProc("GetMessageW")
	procTranslateMessage         = user32.NewProc("TranslateMessage")
	procDispatchMessageW         = user32.NewProc("DispatchMessageW")
	procPostThreadMessageW       = user32.NewProc("PostThreadMessageW")

	kernel32               = syscall.NewLazyDLL("kernel32.dll")
	procOpenProcess        = kernel32.NewProc("OpenProcess")
	procCloseHandle        = kernel32.NewProc("CloseHandle")
	procGetCurrentThreadId = kernel32.NewProc("GetCurrentThreadId")

	psapi                    = syscall.NewLazyDLL("psapi.dll")
	procGetModuleFileNameExW = psapi.NewProc("GetModuleFileNameExW")

	ole32              = syscall.NewLazyDLL("ole32.dll")
	procCoInitialize   = ole32.NewProc("CoInitialize")
	procCoUninitialize = ole32.NewProc("CoUninitialize")
)

type (
	hWINEVENTHOOK uintptr
	hWND          uintptr
	msg           struct {
		HWND    hWND
		Message uint32
		WPARAM  uintptr
		LPARAM  uintptr
		Time    uint32
		Pt      struct {
			X, Y int32
		}
	}
)

type windowsFocusDetector struct {
	events            chan FocusEvent
	mu                sync.Mutex
	hHook             hWINEVENTHOOK
	messageLoopDone   chan struct{}
	messageLoopActive bool
}

// NewFocusDetector creates a new application focus detector.
func NewFocusDetector() FocusDetector {
	return &windowsFocusDetector{
		events:          make(chan FocusEvent, 100),
		messageLoopDone: make(chan struct{}),
	}
}

func (d *windowsFocusDetector) Listen(ctx context.Context) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	// If already listening, return
	if d.messageLoopActive {
		return nil
	}

	// Unhook any existing hook
	if d.hHook != 0 {
		procUnhookWinEvent.Call(uintptr(d.hHook))
		d.hHook = 0
	}

	// Start the message loop in a separate goroutine
	d.messageLoopDone = make(chan struct{})
	d.messageLoopActive = true

	go d.messageLoopWithContext(ctx)

	return nil
}

func (d *windowsFocusDetector) Events() chan FocusEvent {
	return d.events
}

func (d *windowsFocusDetector) onForegroundWindowChange(
	hWinEventHook uintptr,
	event uint32,
	hwnd uintptr,
	idObject int32,
	idChild int32,
	dwEventThread uint32,
	dwmsEventTime uint32,
) uintptr {
	// Get the process ID from the window handle
	var pid uint32
	procGetWindowThreadProcessId.Call(
		hwnd,
		uintptr(unsafe.Pointer(&pid)),
	)

	if pid == 0 {
		return 0
	}

	// Open the process
	access := uint32(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ)
	hProcess, _, _ := procOpenProcess.Call(
		uintptr(access),
		0, // FALSE
		uintptr(pid),
	)

	if hProcess == 0 {
		return 0
	}
	defer procCloseHandle.Call(hProcess)

	// Get the executable path
	// Buffer size is 260 characters (MAX_PATH)
	buffer := make([]uint16, 260)
	ret, _, _ := procGetModuleFileNameExW.Call(
		hProcess,
		0, // NULL for main module
		uintptr(unsafe.Pointer(&buffer[0])),
		uintptr(len(buffer)),
	)

	if ret != 0 {
		executable := syscall.UTF16ToString(buffer)
		select {
		case d.events <- FocusEvent{Executable: executable}:
		default:
			// Channel is full, skip this event
		}
	}

	return 0
}

func (d *windowsFocusDetector) messageLoopWithContext(ctx context.Context) {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	// Initialize COM
	procCoInitialize.Call(0)
	defer procCoUninitialize.Call()

	// Get the current thread ID so we can post messages to it
	threadId, _, _ := procGetCurrentThreadId.Call()

	// Start a goroutine to post WM_QUIT when context is cancelled
	go func() {
		<-ctx.Done()
		slog.Info("Focus detector context cancelled, posting WM_QUIT to thread", "threadId", threadId)
		ret, _, err := procPostThreadMessageW.Call(threadId, WM_QUIT, 0, 0)
		if ret == 0 {
			slog.Warn("Failed to post WM_QUIT", "error", err, "threadId", threadId)
		} else {
			slog.Info("WM_QUIT posted successfully", "threadId", threadId)
		}
	}()

	// Get the current foreground window and trigger callback to initialize state
	hwnd, _, _ := procGetForegroundWindow.Call()
	if hwnd != 0 {
		d.onForegroundWindowChange(0, EVENT_SYSTEM_FOREGROUND, hwnd, 0, 0, 0, 0)
	}

	// Create the WinEvent callback
	winEventProc := syscall.NewCallback(d.onForegroundWindowChange)

	// Set the WinEvent hook
	hook, _, err := procSetWinEventHook.Call(
		uintptr(EVENT_SYSTEM_FOREGROUND),
		uintptr(EVENT_SYSTEM_FOREGROUND),
		0, // hmodWinEventProc (NULL for out-of-context)
		winEventProc,
		0, // idProcess (0 = all processes)
		0, // idThread (0 = all threads)
		uintptr(WINEVENT_OUTOFCONTEXT),
	)

	if hook == 0 {
		d.mu.Lock()
		d.messageLoopActive = false
		d.mu.Unlock()
		// Don't close the events channel - it might be used by the caller
		panic(fmt.Sprintf("Hook error: failed to set WinEvent hook: %v", err))
	}

	d.mu.Lock()
	d.hHook = hWINEVENTHOOK(hook)
	d.mu.Unlock()

	// Message loop
	msg := msg{}
	for {
		ret, _, _ := procGetMessageW.Call(
			uintptr(unsafe.Pointer(&msg)),
			0, // hWnd (NULL = all windows)
			0, // wMsgFilterMin
			0, // wMsgFilterMax
		)

		if ret == 0 {
			// WM_QUIT received
			break
		}

		if ret == 0xFFFFFFFF {
			// Error occurred (-1)
			slog.Error("GetMessageW returned error")
			break
		}

		procTranslateMessage.Call(uintptr(unsafe.Pointer(&msg)))
		procDispatchMessageW.Call(uintptr(unsafe.Pointer(&msg)))
	}

	// Cleanup
	d.mu.Lock()
	if d.hHook != 0 {
		procUnhookWinEvent.Call(uintptr(d.hHook))
		d.hHook = 0
	}
	d.messageLoopActive = false
	d.mu.Unlock()

	close(d.messageLoopDone)
}
