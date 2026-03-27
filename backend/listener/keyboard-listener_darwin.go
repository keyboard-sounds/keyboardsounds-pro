//go:build darwin

package listener

/*
#cgo LDFLAGS: -framework ApplicationServices -framework CoreFoundation

#include <ApplicationServices/ApplicationServices.h>
#include <CoreFoundation/CoreFoundation.h>
#include <stdatomic.h>
#include <stdint.h>

#define RING_SIZE 256
typedef struct {
	uint32_t keyCode;
	int isKeyDown;
	uint64_t timestamp;
	uint64_t modifierFlags;  // CGEventGetFlags(event) — modifiers held when this event occurred
	int listenerID;
} ring_ev_t;

static ring_ev_t ring[RING_SIZE];
static _Atomic uint32_t writePos = 0;
static _Atomic uint32_t readPos = 0;

static volatile int g_stop = 0;

void setStopFlag(int v) {
	g_stop = v;
}

// Modifier key codes on macOS (kVK_* from Carbon / HIToolbox).
#define kVK_Shift       0x38
#define kVK_RightShift  0x3C
#define kVK_Control     0x3B
#define kVK_RightControl 0x3E
#define kVK_Option      0x3A
#define kVK_RightOption 0x3D
#define kVK_Command     0x37
#define kVK_RightCommand 0x36
#define kVK_CapsLock    0x39
#define kVK_Function    0x3F

static CGEventRef keyTapCallback(CGEventTapProxy proxy, CGEventType type, CGEventRef event, void *refcon) {
	int listenerID = (int)(intptr_t)refcon;
	uint64_t timestamp = CGEventGetTimestamp(event);
	int keyCode = (int)CGEventGetIntegerValueField(event, kCGKeyboardEventKeycode);
	CGEventFlags flags = CGEventGetFlags(event);

	int isKeyDown;
	if (type == kCGEventFlagsChanged) {
		// Derive press/release from whether the modifier's own flag bit is now set.
		switch (keyCode) {
			case kVK_Shift:
			case kVK_RightShift:
				isKeyDown = (flags & kCGEventFlagMaskShift) != 0; break;
			case kVK_Control:
			case kVK_RightControl:
				isKeyDown = (flags & kCGEventFlagMaskControl) != 0; break;
			case kVK_Option:
			case kVK_RightOption:
				isKeyDown = (flags & kCGEventFlagMaskAlternate) != 0; break;
			case kVK_Command:
			case kVK_RightCommand:
				isKeyDown = (flags & kCGEventFlagMaskCommand) != 0; break;
			case kVK_CapsLock:
				isKeyDown = (flags & kCGEventFlagMaskAlphaShift) != 0; break;
			default:
				isKeyDown = 1; break;
		}
	} else {
		isKeyDown = (type == kCGEventKeyDown);
	}

	uint32_t wp = atomic_fetch_add(&writePos, 1);
	uint32_t rp = atomic_load(&readPos);
	if (wp - rp >= RING_SIZE)
		atomic_fetch_add(&readPos, 1);
	uint32_t slot = wp % RING_SIZE;
	ring[slot].keyCode = (uint32_t)keyCode;
	ring[slot].isKeyDown = isKeyDown;
	ring[slot].timestamp = timestamp;
	ring[slot].modifierFlags = (uint64_t)flags;
	ring[slot].listenerID = listenerID;

	return event;
}

static void timerCallback(CFRunLoopTimerRef timer, void *info) {
	if (g_stop) {
		CFRunLoopStop(CFRunLoopGetCurrent());
	}
}

int pollEvent(uint32_t *keyCode, int *isKeyDown, uint64_t *timestamp, uint64_t *modifierFlags, int *listenerID) {
	uint32_t rp = atomic_load(&readPos);
	uint32_t wp = atomic_load(&writePos);
	if (rp >= wp)
		return 0;
	uint32_t slot = rp % RING_SIZE;
	*keyCode = ring[slot].keyCode;
	*isKeyDown = ring[slot].isKeyDown;
	*timestamp = ring[slot].timestamp;
	*modifierFlags = ring[slot].modifierFlags;
	*listenerID = ring[slot].listenerID;
	atomic_fetch_add(&readPos, 1);
	return 1;
}

static int runEventLoop(int listenerID) {
	CGEventMask mask = (1 << kCGEventKeyDown) | (1 << kCGEventKeyUp) | (1 << kCGEventFlagsChanged);
	CFMachPortRef tap = CGEventTapCreate(
		kCGSessionEventTap,
		kCGHeadInsertEventTap,
		kCGEventTapOptionListenOnly,
		mask,
		keyTapCallback,
		(void *)(intptr_t)listenerID
	);

	if (!tap) {
		return -1; // e.g. accessibility permission denied
	}

	CFRunLoopSourceRef source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0);
	CFRelease(tap);
	CFRunLoopAddSource(CFRunLoopGetCurrent(), source, kCFRunLoopCommonModes);
	CFRelease(source);

	CFRunLoopTimerContext ctx = {0};
	CFRunLoopTimerRef stopTimer = CFRunLoopTimerCreate(
		kCFAllocatorDefault,
		CFAbsoluteTimeGetCurrent() + 0.1,
		0.1,
		0,
		0,
		timerCallback,
		&ctx
	);
	CFRunLoopAddTimer(CFRunLoopGetCurrent(), stopTimer, kCFRunLoopCommonModes);
	CFRelease(stopTimer);

	CFRunLoopRun();
	return 0;
}
*/
import "C"

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"sync/atomic"
	"time"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/key"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener/listenertypes"
)

// DarwinDevice represents the keyboard event source on macOS (CGEventTap).
var DarwinDevice = listenertypes.Device{
	Name: "macOS (CGEventTap)",
}

// listenerRegistry maps IDs to listeners so the C callback can reach the current listener
// without storing a Go pointer in C.
var (
	listenerRegistry   = make(map[int]*darwinKeyboardListener)
	listenerRegistryMu  sync.Mutex
	nextListenerID     int
)

func registerListener(l *darwinKeyboardListener) int {
	listenerRegistryMu.Lock()
	defer listenerRegistryMu.Unlock()
	nextListenerID++
	id := nextListenerID
	listenerRegistry[id] = l
	return id
}

func unregisterListener(id int) {
	listenerRegistryMu.Lock()
	defer listenerRegistryMu.Unlock()
	delete(listenerRegistry, id)
}

func getListener(id int) *darwinKeyboardListener {
	listenerRegistryMu.Lock()
	defer listenerRegistryMu.Unlock()
	return listenerRegistry[id]
}

type darwinKeyboardListener struct {
	events     chan listenertypes.KeyEvent
	mu         sync.Mutex
	runLoopCtx context.Context
	cancel     context.CancelFunc
	workerDone chan struct{}
	listenerID int
}

// NewKeyboardListener creates a new keyboard listener for macOS using CGEventTap.
func NewKeyboardListener() KeyboardListener {
	return &darwinKeyboardListener{
		events:     make(chan listenertypes.KeyEvent, 100),
		workerDone: make(chan struct{}),
	}
}

// Events returns the channel of key events.
func (l *darwinKeyboardListener) Events() chan listenertypes.KeyEvent {
	return l.events
}

// Listen starts the CGEventTap and emits key events until ctx is cancelled.
func (l *darwinKeyboardListener) Listen(ctx context.Context) error {
	l.mu.Lock()

	// Cancel any existing run loop
	if l.cancel != nil {
		l.cancel()
		l.mu.Unlock()
		select {
		case <-l.workerDone:
		case <-time.After(2 * time.Second):
			slog.Warn("timeout waiting for previous darwin keyboard worker")
		}
		l.mu.Lock()
	}

	runLoopCtx, cancel := context.WithCancel(ctx)
	l.runLoopCtx = runLoopCtx
	l.cancel = cancel
	l.workerDone = make(chan struct{})
	l.listenerID = registerListener(l)

	C.setStopFlag(0)

	// Worker that reads from eventCh and sends to events
	go l.worker(runLoopCtx)

	// Run the event loop in a separate goroutine (C.runEventLoop blocks)
	done := make(chan struct{})
	var runLoopErr atomic.Value
	listenerID := l.listenerID
	go func() {
		defer close(done)
		ret := C.runEventLoop(C.int(listenerID))
		unregisterListener(listenerID)
		if ret != 0 {
			runLoopErr.Store(fmt.Errorf("CGEventTapCreate failed (accessibility permission may be required)"))
		}
	}()

	l.mu.Unlock()

	// Wait for run loop to start and possibly fail quickly (e.g. no permission)
	select {
	case <-done:
		if err, ok := runLoopErr.Load().(error); ok && err != nil {
			cancel()
			<-l.workerDone
			return err
		}
	case <-runLoopCtx.Done():
		C.setStopFlag(1)
		<-done
		<-l.workerDone
		return runLoopCtx.Err()
	case <-time.After(500 * time.Millisecond):
		// Run loop is running
	}

	// When context is cancelled, signal C to stop the run loop; worker exits on ctx.Done()
	go func() {
		<-runLoopCtx.Done()
		C.setStopFlag(1)
		<-done
	}()

	slog.Info("darwin keyboard listener started", "listenerID", l.listenerID)
	return nil
}

func (l *darwinKeyboardListener) worker(ctx context.Context) {
	defer close(l.workerDone)

	var timeBase time.Time
	var timeBaseSet bool
	var keyCode C.uint32_t
	var isKeyDown C.int
	var timestamp C.uint64_t
	var modifierFlags C.uint64_t
	var listenerID C.int

	// CGEventFlags mask bits (match NSEventModifierFlags / CGEventFlags in CoreGraphics).
	const (
		cgEventFlagMaskShift     = 1 << 17 // kCGEventFlagMaskShift
		cgEventFlagMaskControl  = 1 << 18 // kCGEventFlagMaskControl
		cgEventFlagMaskAlternate = 1 << 19 // kCGEventFlagMaskAlternate (Option)
		cgEventFlagMaskCommand  = 1 << 20 // kCGEventFlagMaskCommand
	)

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}
		if C.pollEvent(&keyCode, &isKeyDown, &timestamp, &modifierFlags, &listenerID) != 1 {
			time.Sleep(100 * time.Microsecond)
			continue
		}
		li := getListener(int(listenerID))
		if li == nil {
			continue
		}
		tsNanos := time.Duration(timestamp) * time.Nanosecond
		if !timeBaseSet {
			timeBase = time.Now().Add(-tsNanos)
			timeBaseSet = true
		}
		ts := timeBase.Add(tsNanos)
		action := listenertypes.ActionPress
		if isKeyDown == 0 {
			action = listenertypes.ActionRelease
		}
		// Decode modifier flags for companion modifier display (e.g. "Ctrl+Shift+A").
		// Exclude the primary key itself from ModifierKeys to avoid duplication when
		// a modifier key is pressed alone (e.g. pressing Shift should not also list
		// Shift in ModifierKeys).
		primaryKey := key.FindKeyCode(uint32(keyCode))
		flags := uint64(modifierFlags)
		var modifierKeys []key.Key
		if flags&cgEventFlagMaskShift != 0 && primaryKey != key.LeftShift && primaryKey != key.RightShift {
			modifierKeys = append(modifierKeys, key.LeftShift)
		}
		if flags&cgEventFlagMaskControl != 0 && primaryKey != key.LeftControl && primaryKey != key.RightControl {
			modifierKeys = append(modifierKeys, key.LeftControl)
		}
		if flags&cgEventFlagMaskAlternate != 0 && primaryKey != key.LeftAlt && primaryKey != key.RightAlt {
			modifierKeys = append(modifierKeys, key.LeftAlt)
		}
		if flags&cgEventFlagMaskCommand != 0 && primaryKey != key.LeftWin {
			modifierKeys = append(modifierKeys, key.LeftWin)
		}
		keyEvent := listenertypes.KeyEvent{
			Device:       &DarwinDevice,
			Key:          primaryKey,
			Action:       action,
			Timestamp:    ts,
			ModifierKeys: modifierKeys,
		}
		select {
		case li.events <- keyEvent:
		case <-ctx.Done():
			return
		}
	}
}
