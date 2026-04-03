//go:build darwin

package listener

/*
#cgo LDFLAGS: -framework ApplicationServices -framework CoreFoundation

#include <ApplicationServices/ApplicationServices.h>
#include <CoreFoundation/CoreFoundation.h>
#include <stdatomic.h>
#include <stdint.h>

#define MOUSE_RING_SIZE 256
typedef struct {
	int button;       // 0=left, 1=right, 2=middle
	int action;       // 1=press, 0=release
	uint64_t timestamp;
	int listenerID;
} mouse_ring_ev_t;

static mouse_ring_ev_t mouse_ring[MOUSE_RING_SIZE];
static _Atomic uint32_t mouse_writePos = 0;
static _Atomic uint32_t mouse_readPos = 0;

static volatile int mouse_g_stop = 0;

void mouse_setStopFlag(int v) {
	mouse_g_stop = v;
}

static CGEventRef mouseTapCallback(CGEventTapProxy proxy, CGEventType type, CGEventRef event, void *refcon) {
	int listenerID = (int)(intptr_t)refcon;
	uint64_t timestamp = CGEventGetTimestamp(event);
	int button = -1;
	int action = -1;

	switch (type) {
	case kCGEventLeftMouseDown:
		button = 0; action = 1;
		break;
	case kCGEventLeftMouseUp:
		button = 0; action = 0;
		break;
	case kCGEventRightMouseDown:
		button = 1; action = 1;
		break;
	case kCGEventRightMouseUp:
		button = 1; action = 0;
		break;
	case kCGEventOtherMouseDown:
		button = 2; action = 1;
		break;
	case kCGEventOtherMouseUp:
		button = 2; action = 0;
		break;
	default:
		return event;
	}

	uint32_t wp = atomic_fetch_add(&mouse_writePos, 1);
	uint32_t rp = atomic_load(&mouse_readPos);
	if (wp - rp >= MOUSE_RING_SIZE)
		atomic_fetch_add(&mouse_readPos, 1);
	uint32_t slot = wp % MOUSE_RING_SIZE;
	mouse_ring[slot].button = button;
	mouse_ring[slot].action = action;
	mouse_ring[slot].timestamp = timestamp;
	mouse_ring[slot].listenerID = listenerID;

	return event;
}

static void mouse_timerCallback(CFRunLoopTimerRef timer, void *info) {
	if (mouse_g_stop) {
		CFRunLoopStop(CFRunLoopGetCurrent());
	}
}

int mouse_pollEvent(int *button, int *action, uint64_t *timestamp, int *listenerID) {
	uint32_t rp = atomic_load(&mouse_readPos);
	uint32_t wp = atomic_load(&mouse_writePos);
	if (rp >= wp)
		return 0;
	uint32_t slot = rp % MOUSE_RING_SIZE;
	*button = mouse_ring[slot].button;
	*action = mouse_ring[slot].action;
	*timestamp = mouse_ring[slot].timestamp;
	*listenerID = mouse_ring[slot].listenerID;
	atomic_fetch_add(&mouse_readPos, 1);
	return 1;
}

static int mouse_runEventLoop(int listenerID) {
	CGEventMask mask = (1 << kCGEventLeftMouseDown)  | (1 << kCGEventLeftMouseUp) |
	                   (1 << kCGEventRightMouseDown) | (1 << kCGEventRightMouseUp) |
	                   (1 << kCGEventOtherMouseDown) | (1 << kCGEventOtherMouseUp);
	CFMachPortRef tap = CGEventTapCreate(
		kCGSessionEventTap,
		kCGHeadInsertEventTap,
		kCGEventTapOptionListenOnly,
		mask,
		mouseTapCallback,
		(void *)(intptr_t)listenerID
	);

	if (!tap) {
		return -1;
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
		mouse_timerCallback,
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

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener/listenertypes"
)

// DarwinMouseDevice represents the mouse event source on macOS (CGEventTap).
var DarwinMouseDevice = listenertypes.Device{
	Name: "macOS (CGEventTap)",
}

var (
	mouseListenerRegistry   = make(map[int]*darwinMouseListener)
	mouseListenerRegistryMu sync.Mutex
	nextMouseListenerID     int
)

func registerMouseListener(l *darwinMouseListener) int {
	mouseListenerRegistryMu.Lock()
	defer mouseListenerRegistryMu.Unlock()
	nextMouseListenerID++
	id := nextMouseListenerID
	mouseListenerRegistry[id] = l
	return id
}

func unregisterMouseListener(id int) {
	mouseListenerRegistryMu.Lock()
	defer mouseListenerRegistryMu.Unlock()
	delete(mouseListenerRegistry, id)
}

func getMouseListener(id int) *darwinMouseListener {
	mouseListenerRegistryMu.Lock()
	defer mouseListenerRegistryMu.Unlock()
	return mouseListenerRegistry[id]
}

func mouseButtonFromC(button C.int) (listenertypes.Button, bool) {
	switch button {
	case 0:
		return listenertypes.ButtonLeft, true
	case 1:
		return listenertypes.ButtonRight, true
	case 2:
		return listenertypes.ButtonMiddle, true
	default:
		return "", false
	}
}

type darwinMouseListener struct {
	events     chan listenertypes.ButtonEvent
	mu         sync.Mutex
	runLoopCtx context.Context
	cancel     context.CancelFunc
	workerDone chan struct{}
	listenerID int
}

// NewMouseListener creates a new mouse listener for macOS using CGEventTap.
func NewMouseListener() MouseListener {
	return &darwinMouseListener{
		events:     make(chan listenertypes.ButtonEvent, 100),
		workerDone: make(chan struct{}),
	}
}

// Events returns the channel of button events.
func (l *darwinMouseListener) Events() chan listenertypes.ButtonEvent {
	return l.events
}

// Listen starts the CGEventTap and emits mouse button events until ctx is cancelled.
func (l *darwinMouseListener) Listen(ctx context.Context) error {
	l.mu.Lock()

	if l.cancel != nil {
		l.cancel()
		l.mu.Unlock()
		select {
		case <-l.workerDone:
		case <-time.After(2 * time.Second):
			slog.Warn("timeout waiting for previous darwin mouse worker")
		}
		l.mu.Lock()
	}

	runLoopCtx, cancel := context.WithCancel(ctx)
	l.runLoopCtx = runLoopCtx
	l.cancel = cancel
	l.workerDone = make(chan struct{})
	l.listenerID = registerMouseListener(l)

	C.mouse_setStopFlag(0)

	go l.mouseWorker(runLoopCtx)

	done := make(chan struct{})
	var runLoopErr atomic.Value
	listenerID := l.listenerID
	go func() {
		defer close(done)
		ret := C.mouse_runEventLoop(C.int(listenerID))
		unregisterMouseListener(listenerID)
		if ret != 0 {
			runLoopErr.Store(fmt.Errorf("CGEventTapCreate failed (accessibility permission may be required)"))
		}
	}()

	l.mu.Unlock()

	select {
	case <-done:
		if err, ok := runLoopErr.Load().(error); ok && err != nil {
			cancel()
			<-l.workerDone
			return err
		}
	case <-runLoopCtx.Done():
		C.mouse_setStopFlag(1)
		<-done
		<-l.workerDone
		return runLoopCtx.Err()
	case <-time.After(500 * time.Millisecond):
	}

	go func() {
		<-runLoopCtx.Done()
		C.mouse_setStopFlag(1)
		<-done
	}()

	slog.Info("darwin mouse listener started", "listenerID", l.listenerID)
	return nil
}

func (l *darwinMouseListener) mouseWorker(ctx context.Context) {
	defer close(l.workerDone)

	var timeBase time.Time
	var timeBaseSet bool
	var button C.int
	var action C.int
	var timestamp C.uint64_t
	var listenerID C.int

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}
		if C.mouse_pollEvent(&button, &action, &timestamp, &listenerID) != 1 {
			time.Sleep(100 * time.Microsecond)
			continue
		}
		li := getMouseListener(int(listenerID))
		if li == nil {
			continue
		}
		btn, ok := mouseButtonFromC(button)
		if !ok {
			continue
		}
		tsNanos := time.Duration(timestamp) * time.Nanosecond
		if !timeBaseSet {
			timeBase = time.Now().Add(-tsNanos)
			timeBaseSet = true
		}
		ts := timeBase.Add(tsNanos)
		act := listenertypes.ActionPress
		if action == 0 {
			act = listenertypes.ActionRelease
		}
		ev := listenertypes.ButtonEvent{
			Device:    &DarwinMouseDevice,
			Button:    btn,
			Action:    act,
			Timestamp: ts,
		}
		select {
		case li.events <- ev:
		case <-ctx.Done():
			return
		}
	}
}
