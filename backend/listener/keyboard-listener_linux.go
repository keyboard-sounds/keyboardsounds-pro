package listener

import (
	"context"
	"errors"
	"log/slog"
	"sync"
	"time"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/key"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener/listenertypes"
)

type linuxKeyboardListener struct {
	events    chan listenertypes.KeyEvent
	wg        sync.WaitGroup
	closeOnce sync.Once
}

// NewKeyboardListener creates a new keyboard listener for the current platform.
func NewKeyboardListener() KeyboardListener {
	return &linuxKeyboardListener{
		events: make(chan listenertypes.KeyEvent, 100),
	}
}

// Events returns a channel of key events.
func (l *linuxKeyboardListener) Events() chan listenertypes.KeyEvent {
	return l.events
}

// Listen starts the listener.
func (l *linuxKeyboardListener) Listen(ctx context.Context) error {
	devices, err := listKeyboards()
	if err != nil {
		return err
	}

	if len(devices) < 1 {
		return errors.New("no keyboards found")
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
				// Only process EV_KEY events, ignore SYN and other event types
				if event.Type != ev_type_key {
					continue
				}

				var action listenertypes.Action
				switch event.Value {
				case 1:
					action = listenertypes.ActionPress
				case 0:
					action = listenertypes.ActionRelease
				case 2:
					// Key repeat/autorepeat - treat as press
					action = listenertypes.ActionPress
				default:
					// Ignore other event values
					continue
				}

				keyEvent := listenertypes.KeyEvent{
					Device:    &listenertypes.Device{Name: d.Name},
					Key:       key.FindKeyCode(uint32(event.Code)),
					Action:    action,
					Timestamp: time.Unix(int64(event.Time[0]), int64(event.Time[1])),
				}

				select {
				case l.events <- keyEvent:
				case <-ctx.Done():
					return
				default:
					slog.Warn("events channel buffer full, dropping event", "key", keyEvent.Key, "action", keyEvent.Action)
				}
			}
		}(device)
	}

	if attachedDevices < 1 {
		l.closeOnce.Do(func() {
			close(l.events)
		})
		return errors.New("failed to attach to any keyboards")
	}

	go func() {
		l.wg.Wait()
		l.closeOnce.Do(func() {
			close(l.events)
		})
	}()

	return nil
}
