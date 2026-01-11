package listener

import (
	"context"
	"fmt"
	"log/slog"
	"runtime"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
	"unsafe"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/key"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener/listenertypes"
)

// WindowsDevice represents a device that generates keyboard events. On Windows, this is the WH_KEYBOARD_LL hook.
var WindowsDevice = listenertypes.Device{
	Name: "Windows (WH_KEYBOARD_LL Hook)",
}

// NewKeyboardListener creates a new keyboard listener for the current platform.
func NewKeyboardListener() KeyboardListener {
	// Use a lock-free ring buffer for maximum performance
	// The hook callback writes to the ring buffer atomically (no locks, no channels)
	// A separate worker goroutine reads from the ring buffer and sends to the events channel
	return &windowsKeyboardListener{
		events:     make(chan listenertypes.KeyEvent, 100),
		workerDone: make(chan struct{}),
	}
}

const (
	// Ring buffer size - must be power of 2 for efficient modulo
	ringBufferSize = 1024
	ringBufferMask = ringBufferSize - 1
)

type windowsKeyboardListener struct {
	events            chan listenertypes.KeyEvent
	hHook             hHOOK
	mu                sync.Mutex
	messageLoopCtx    context.Context
	messageLoopCancel context.CancelFunc

	ringBuffer   [ringBufferSize]kbdllhookstruct
	ringWritePos uint64        // Atomic counter for write position
	ringReadPos  uint64        // Atomic counter for read position
	workerDone   chan struct{} // Signal when worker is done
}

// Events returns a channel of key events.
func (l *windowsKeyboardListener) Events() chan listenertypes.KeyEvent {
	return l.events
}

// Listen starts the listener.
func (l *windowsKeyboardListener) Listen(ctx context.Context) error {
	l.mu.Lock()

	// Save the old workerDone channel before cancelling
	var oldWorkerDone chan struct{}
	if l.messageLoopCancel != nil {
		oldWorkerDone = l.workerDone
		slog.Info("Stopping existing listener", "hook", l.hHook)
	}

	// Cancel any existing message loop
	if l.messageLoopCancel != nil {
		slog.Info("Cancelling existing message loop")
		l.messageLoopCancel()
	}

	// Unhook any existing hook BEFORE starting a new one
	if l.hHook != 0 {
		slog.Info("Unhooking existing Windows hook", "h", l.hHook)
		ret, _, err := procUnhookWindowsHookEx.Call(uintptr(l.hHook))
		if ret == 0 {
			slog.Warn("Failed to unhook Windows hook", "error", err, "h", l.hHook)
		} else {
			slog.Info("Successfully unhooked Windows hook", "h", l.hHook)
		}
		l.hHook = 0
	}

	// Reset ring buffer positions
	atomic.StoreUint64(&l.ringWritePos, 0)
	atomic.StoreUint64(&l.ringReadPos, 0)
	slog.Info("Reset ring buffer positions", "writePos", 0, "readPos", 0)

	// Create a new context for the message loop that will be cancelled
	// when the hook is removed or a new Listen() is called
	messageLoopCtx, cancel := context.WithCancel(ctx)
	l.messageLoopCtx = messageLoopCtx
	l.messageLoopCancel = cancel

	// Create a new workerDone channel for this worker instance
	l.workerDone = make(chan struct{})

	// Start the worker goroutine that processes events from the queue FIRST
	// This ensures the worker is ready before we start receiving events
	go l.eventWorker(messageLoopCtx)
	slog.Info("Started event worker goroutine")

	// CRITICAL: Set the hook and run the message loop in the SAME goroutine
	// that's locked to an OS thread. For low-level hooks, the hook callback
	// is called in the context of the thread that installed the hook, so they
	// must be on the same thread.
	hookSetChan := make(chan struct {
		handle hHOOK
		err    error
	})
	messageLoopStarted := make(chan struct{})
	go func() {
		runtime.LockOSThread()
		defer runtime.UnlockOSThread()
		slog.Info("Hook/message loop goroutine locked to OS thread")

		// Set the hook on this thread
		slog.Info("Setting Windows hook", "hook_type", wh_keyboard_ll)
		h, _, err := procSetWindowsHookEx.Call(
			uintptr(wh_keyboard_ll),
			syscall.NewCallback(l.hook(messageLoopCtx)),
			0,
			0,
		)
		if h == 0 {
			slog.Error("Failed to set Windows hook", "error", err)
			hookSetChan <- struct {
				handle hHOOK
				err    error
			}{handle: 0, err: fmt.Errorf("failed to set Windows hook: %v (GetLastError may provide more info)", err)}
			return
		}
		slog.Info("Windows hook set successfully", "h", h)

		// Store the hook handle (need to acquire lock)
		l.mu.Lock()
		l.hHook = hHOOK(h)
		hookHandle := l.hHook
		l.mu.Unlock()

		// Signal that hook is set
		hookSetChan <- struct {
			handle hHOOK
			err    error
		}{handle: hookHandle, err: nil}

		// Signal that message loop is starting
		close(messageLoopStarted)
		slog.Info("Starting message loop on hook thread")

		// Run the message loop on the same thread
		l.executeMessageLoop(messageLoopCtx)
	}()
	slog.Info("Started hook/message loop goroutine")

	// Release the mutex before waiting to avoid deadlock
	l.mu.Unlock()

	// Wait for hook to be set
	select {
	case result := <-hookSetChan:
		if result.err != nil {
			cancel()
			l.mu.Lock()
			l.messageLoopCtx = nil
			l.messageLoopCancel = nil
			l.mu.Unlock()
			return result.err
		}
		if result.handle == 0 {
			cancel()
			l.mu.Lock()
			l.messageLoopCtx = nil
			l.messageLoopCancel = nil
			l.mu.Unlock()
			return fmt.Errorf("hook handle is zero after setting")
		}
		slog.Info("Hook set confirmed", "h", result.handle)
	case <-time.After(1 * time.Second):
		cancel()
		l.mu.Lock()
		l.messageLoopCtx = nil
		l.messageLoopCancel = nil
		l.mu.Unlock()
		return fmt.Errorf("timeout waiting for hook to be set")
	}

	// Wait for message loop to start
	select {
	case <-messageLoopStarted:
		slog.Info("Message loop started on hook thread")
	case <-time.After(100 * time.Millisecond):
		slog.Warn("Timeout waiting for message loop to start")
	}

	// Wait for the old worker to finish (with timeout to avoid hanging)
	if oldWorkerDone != nil {
		slog.Info("Waiting for old worker to finish")
		select {
		case <-oldWorkerDone:
			slog.Info("Old worker finished")
		case <-time.After(2 * time.Second):
			slog.Warn("Timeout waiting for old worker to finish")
		}
	}

	// Re-acquire the mutex (to match the defer)
	l.mu.Lock()
	defer l.mu.Unlock()

	slog.Info("Listener started successfully", "hook", l.hHook)
	return nil
}

func (l *windowsKeyboardListener) hook(ctx context.Context) hookFunc {
	return func(nCode int, wParam, lParam uintptr) uintptr {
		// CRITICAL: This hook procedure must return IMMEDIATELY to avoid blocking
		// the entire system's keyboard input.

		// Check if context is cancelled - if so, just pass through
		select {
		case <-ctx.Done():
			// Context cancelled, just pass through to next hook
			r1, _, _ := procCallNextHookEx.Call(0, uintptr(nCode), wParam, lParam)
			return r1
		default:
		}

		// Always call CallNextHookEx immediately to return control to the system
		// This MUST be done before any processing to avoid blocking system input
		r1, _, _ := procCallNextHookEx.Call(0, uintptr(nCode), wParam, lParam)

		// Process the event only if nCode >= 0 (valid event)
		if nCode >= 0 {
			// Copy the hook struct data immediately (lParam is only valid during this call)
			// ignore "possible misuse of unsafe.Pointer" warning, lParam is guaranteed by
			// the Windows API to be a pointer to a kbDLLHOOKSTRUCT.
			kbStruct := (*kbdllhookstruct)(unsafe.Pointer(lParam))
			kbData := *kbStruct // Copy the struct

			// Write to ring buffer using atomic operations (lock-free, no blocking)
			// Reserve a slot by atomically incrementing writePos
			writePos := atomic.AddUint64(&l.ringWritePos, 1) - 1
			idx := writePos & ringBufferMask

			// Check if buffer is full (read hasn't caught up)
			// We check AFTER incrementing to avoid race conditions
			readPos := atomic.LoadUint64(&l.ringReadPos)
			if writePos-readPos >= ringBufferSize {
				// Buffer full, drop event (very rare - only if consumer is extremely slow)
				slog.Warn("Ring buffer full, event may be dropped",
					"writePos", writePos,
					"readPos", readPos,
					"vkCode", kbData.VKCode)
				// Note: We've already incremented writePos, but that's okay -
				// the reader will eventually catch up and skip this slot
			}

			// Write the data (this is a simple assignment, very fast)
			// Even if buffer was full, we write anyway - the reader will skip stale data
			l.ringBuffer[idx] = kbData
		}

		return r1
	}
}

// eventWorker processes events from the ring buffer and sends them to the events channel.
// This runs in a separate goroutine to avoid blocking the hook callback.
func (l *windowsKeyboardListener) eventWorker(ctx context.Context) {
	defer func() {
		slog.Info("Event worker stopping")
		close(l.workerDone)
	}()

	slog.Info("Event worker started")
	eventCount := 0

	for {
		// Check context cancellation
		select {
		case <-ctx.Done():
			slog.Info("Event worker context cancelled", "events_processed", eventCount)
			return
		default:
		}

		// Read from ring buffer
		readPos := atomic.LoadUint64(&l.ringReadPos)
		writePos := atomic.LoadUint64(&l.ringWritePos)

		if readPos < writePos {
			// There are events to process
			idx := readPos & ringBufferMask
			kbData := l.ringBuffer[idx]

			// Advance read position
			atomic.StoreUint64(&l.ringReadPos, readPos+1)

			// Determine action
			action := listenertypes.ActionPress
			if kbData.Flags&llkhf_up != 0 {
				action = listenertypes.ActionRelease
			}

			// Build the event
			event := listenertypes.KeyEvent{
				Device:    &WindowsDevice,
				Key:       key.FindKeyCode(kbData.VKCode),
				Action:    action,
				Timestamp: parseTime(kbData.Time),
			}

			eventCount++

			// Send to the events channel (this can block, but it's in a worker goroutine)
			select {
			case l.events <- event:
				// Event sent successfully
			case <-ctx.Done():
				slog.Info("Event worker context cancelled while sending event")
				return
			}
		} else {
			// No events available, sleep briefly to avoid busy-waiting
			time.Sleep(100 * time.Microsecond)
		}
	}
}

// executeMessageLoop is an internal function used to listen for events from the
// Windows API. It uses GetMessageW() which blocks until a message is available,
// ensuring messages are processed immediately without busy-waiting.
// We post a WM_QUIT message when the context is cancelled to wake up GetMessage.
func (l *windowsKeyboardListener) executeMessageLoop(ctx context.Context) {
	slog.Info("Starting message loop")

	// Capture the workerDone channel at the start so we wait on the correct channel
	// even if l.workerDone is replaced later
	l.mu.Lock()
	workerDone := l.workerDone
	currentHook := l.hHook
	l.mu.Unlock()

	slog.Info("Message loop initialized", "hook", currentHook, "workerDone", workerDone != nil)

	// Get the current thread ID so we can post messages to it
	threadId, _, _ := procGetCurrentThreadId.Call()
	slog.Info("Message loop thread ID", "threadId", threadId)

	// Start a goroutine to post WM_QUIT when context is cancelled
	quitPosted := make(chan struct{})
	go func() {
		<-ctx.Done()
		slog.Info("Context cancelled, posting WM_QUIT to thread", "threadId", threadId)
		ret, _, err := procPostThreadMessageW.Call(threadId, wm_quit, 0, 0)
		if ret == 0 {
			slog.Warn("Failed to post WM_QUIT", "error", err, "threadId", threadId)
		} else {
			slog.Info("WM_QUIT posted successfully", "threadId", threadId)
		}
		close(quitPosted)
	}()

	defer func() {
		slog.Info("Message loop defer: cleaning up")
		l.mu.Lock()
		defer l.mu.Unlock()

		if l.hHook != 0 && l.messageLoopCtx == ctx {
			slog.Info("Unhooking in message loop defer", "h", l.hHook)
			ret, _, err := procUnhookWindowsHookEx.Call(uintptr(l.hHook))
			if ret == 0 {
				slog.Warn("Failed to unhook in defer", "error", err, "h", l.hHook)
			} else {
				slog.Info("Successfully unhooked in defer", "h", l.hHook)
			}
			l.hHook = 0
		}

		// Wait for worker to finish using the captured channel
		slog.Info("Waiting for worker to finish in message loop defer")
		select {
		case <-workerDone:
			slog.Info("Worker finished in message loop defer")
		case <-time.After(2 * time.Second):
			slog.Warn("Timeout waiting for worker in message loop defer")
		}
		slog.Info("Message loop cleanup complete")
	}()

	var msg msg
	messageCount := 0
	lastLogTime := time.Now()

	for {
		// GetMessageW blocks until a message is available
		// This is the proper way to handle Windows message loops
		// Returns -1 on error, 0 on WM_QUIT, >0 on success
		slog.Debug("Calling GetMessageW (blocking)")
		r1, _, err := procGetMessageW.Call(
			uintptr(unsafe.Pointer(&msg)),
			0,
			0,
			0,
		)

		messageCount++
		now := time.Now()
		if messageCount <= 5 || now.Sub(lastLogTime) > 5*time.Second {
			slog.Info("GetMessageW returned",
				"return", r1,
				"message", msg.Message,
				"messageCount", messageCount,
				"error", err)
			lastLogTime = now
		}

		switch r1 {
		case 0:
			// WM_QUIT received (either from context cancellation or system)
			slog.Info("WM_QUIT received, exiting message loop", "messageCount", messageCount)
			return
		case 0xFFFFFFFF:
			// Error occurred (-1)
			slog.Error("GetMessageW returned error", "error", err, "messageCount", messageCount)
			return
		}

		// Process the message immediately
		// For low-level keyboard hooks, we don't need to translate/dispatch,
		// but it's harmless and may be needed for other message types
		procTranslateMessage.Call(uintptr(unsafe.Pointer(&msg)))
		procDispatchMessageW.Call(uintptr(unsafe.Pointer(&msg)))
	}
}

// parseTime converts a Windows system time to a time.Time.
func parseTime(t uint32) time.Time {
	sysTime, _, _ := procGetTickCount.Call()
	now := time.Now()
	bootTime := now.Add(-time.Duration(int64(sysTime)) * time.Millisecond)
	return bootTime.Add(time.Duration(t) * time.Millisecond)
}
