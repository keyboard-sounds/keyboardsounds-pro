package listener

import (
	"context"
	"errors"
	"log/slog"
	"sync"
	"time"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener/listenertypes"
)

// Linux evdev button codes (from input-event-codes.h)
const (
	btnLeft   = 0x110 // BTN_LEFT
	btnRight  = 0x111 // BTN_RIGHT
	btnMiddle = 0x112 // BTN_MIDDLE
)

type linuxMouseListener struct {
	events    chan listenertypes.ButtonEvent
	wg        sync.WaitGroup
	closeOnce sync.Once
}

// NewMouseListener creates a new mouse listener for the current platform.
func NewMouseListener() MouseListener {
	return &linuxMouseListener{
		events: make(chan listenertypes.ButtonEvent, 100),
	}
}

// Events returns a channel of button events.
func (l *linuxMouseListener) Events() chan listenertypes.ButtonEvent {
	return l.events
}

// Listen starts the listener.
func (l *linuxMouseListener) Listen(ctx context.Context) error {
	devices, err := listPointerDevices()
	if err != nil {
		return err
	}

	if len(devices) < 1 {
		return errors.New("no pointer devices found")
	}

	attachedDevices := 0

	for _, device := range devices {
		channel := make(chan event, 100)
		err := device.attachChannel(ctx, channel)
		if err != nil {
			slog.Error("failed to attach channel to device", "error", err)
			continue
		}

		attachedDevices++

		l.wg.Add(1)
		go func(d *linuxDevice) {
			defer l.wg.Done()
			for event := range channel {
				// Only process EV_KEY events (mouse buttons use EV_KEY on Linux)
				if event.Type != ev_type_key {
					continue
				}

				button, ok := evdevCodeToButton(event.Code)
				if !ok {
					continue
				}

				var action listenertypes.Action
				switch event.Value {
				case 1:
					action = listenertypes.ActionPress
				case 0:
					action = listenertypes.ActionRelease
				case 2:
					// Button repeat - treat as press
					action = listenertypes.ActionPress
				default:
					continue
				}

				buttonEvent := listenertypes.ButtonEvent{
					Device:    &listenertypes.Device{Name: d.Name},
					Button:    button,
					Action:    action,
					Timestamp: time.Unix(int64(event.Time[0]), int64(event.Time[1])),
				}

				select {
				case l.events <- buttonEvent:
				case <-ctx.Done():
					return
				default:
					slog.Warn("events channel buffer full, dropping event", "button", buttonEvent.Button, "action", buttonEvent.Action)
				}
			}
		}(device)
	}

	if attachedDevices < 1 {
		l.closeOnce.Do(func() {
			close(l.events)
		})
		return errors.New("failed to attach to any pointer devices")
	}

	go func() {
		l.wg.Wait()
		l.closeOnce.Do(func() {
			close(l.events)
		})
	}()

	return nil
}

// evdevCodeToButton maps Linux evdev button codes to listenertypes.Button.
func evdevCodeToButton(code uint16) (listenertypes.Button, bool) {
	switch code {
	case btnLeft:
		return listenertypes.ButtonLeft, true
	case btnRight:
		return listenertypes.ButtonRight, true
	case btnMiddle:
		return listenertypes.ButtonMiddle, true
	default:
		return "", false
	}
}
