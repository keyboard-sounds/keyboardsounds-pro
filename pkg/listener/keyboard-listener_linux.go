package listener

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"math/bits"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
	"unsafe"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/key"
	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/listener/listenertypes"
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

type event struct {
	Time  [2]uint64 // Timestamp (seconds and microseconds)
	Type  eventType // Event type
	Code  uint16    // Event code
	Value int32     // Event value (1 for key press, 0 for key release, 2 for key repeat)
}

// eventFlag is a flag that is used to determine if a particular device supports a particular event.
type eventFlag int

const (
	ev_key eventFlag = 0x0002
	ev_rel eventFlag = 0x0004
	ev_abs eventFlag = 0x0008
)

// eventType is a type of event that is sent by the device.
type eventType uint16

const (
	ev_type_key eventType = 0x01
)

// deviceCapabilities holds information on the event and key capabilities of the device.
type deviceCapabilities struct {
	EventTypes *big.Int
	KeyTypes   []*big.Int
}

// SupportsKey returns true if the device supports the given key code.
func (cap deviceCapabilities) SupportsKey(keyCode int) bool {
	bitsPerField := 8 * len(cap.KeyTypes[0].Bytes())
	for i, field := range cap.KeyTypes {
		start := i * bitsPerField
		end := start + bitsPerField
		if keyCode >= start && keyCode < end {
			return field.Bit(keyCode-start) == 1
		}
	}
	return false
}

// SupportsEvent returns true if the device supports the given event.
// eventType is a bitmask value (e.g., EV_KEY = 0x0002), so we need to find
// the bit index by finding the position of the least significant set bit.
func (cap deviceCapabilities) SupportsEvent(eventType eventFlag) bool {
	bitIndex := bits.TrailingZeros(uint(eventType))
	if bitIndex >= cap.EventTypes.BitLen() {
		return false
	}
	return cap.EventTypes.Bit(bitIndex) == 1
}

// linuxDevice holds metadata for an input device.
type linuxDevice struct {
	deviceCapabilities

	ID        int
	Path      string
	SysFsPath string
	Name      string

	handle *os.File
}

// listKeyboards returns a list of Devices that support the EV_KEY event type, and support common keyboard keys.
func listKeyboards() ([]*linuxDevice, error) {
	var keyboards []*linuxDevice
	devices, err := listDevices()
	if err != nil {
		return nil, err
	}

keyboardCheck:
	for _, device := range devices {
		slog.Info("device", "name", device.Name, "supportsEvent", device.SupportsEvent(ev_key))
		if device.SupportsEvent(ev_key) {
			common := []int{1, 30, 46, 48, 28}
			for _, key := range common {
				if !device.SupportsKey(key) {
					continue keyboardCheck
				}
			}

			keyboards = append(keyboards, device)
		}
	}

	return keyboards, nil
}

// listPointerDevices returns a list of Devices that support the EV_REL or EV_ABS event type. These are normally pointer devices like mice and touch-pads/track-pads.
func listPointerDevices() ([]*linuxDevice, error) {
	var pointers []*linuxDevice
	devices, err := listDevices()
	if err != nil {
		return nil, err
	}

	for _, device := range devices {
		if device.SupportsEvent(ev_rel) || device.SupportsEvent(ev_abs) {
			pointers = append(pointers, device)
		}
	}

	return pointers, nil
}

// getDevice reads and returns metadata for a specific input device.
func getDevice(eventID int) (*linuxDevice, error) {
	basePath := fmt.Sprintf("/sys/class/input/event%d/device", eventID)

	// Read the device name
	data, err := os.ReadFile(filepath.Join(basePath, "name"))
	if err != nil {
		return nil, err
	}
	name := strings.TrimSpace(string(data))

	// Read capabilities
	evPath := filepath.Join(basePath, "capabilities/ev")
	evCapabilityMasks, err := readBitMasks(evPath)
	if err != nil {
		return nil, err
	}
	if len(evCapabilityMasks) != 1 {
		return nil, fmt.Errorf("expected 1 bit mask for %s, got %d", evPath, len(evCapabilityMasks))
	}

	keyCapabilityMasks, err := readBitMasks(filepath.Join(basePath, "capabilities/key"))
	if err != nil {
		return nil, err
	}

	capabilities := deviceCapabilities{
		EventTypes: evCapabilityMasks[0],
		KeyTypes:   keyCapabilityMasks,
	}

	return &linuxDevice{
		ID:                 eventID,
		SysFsPath:          basePath,
		Path:               fmt.Sprintf("/dev/input/event%d", eventID),
		Name:               name,
		deviceCapabilities: capabilities,
	}, nil
}

// listDevices returns a list of Devices from /sys/class/input.
func listDevices() ([]*linuxDevice, error) {
	var devices []*linuxDevice

	// Loop through event directories in /sys/class/input
	for i := 0; ; i++ {
		device, err := getDevice(i)
		if err != nil {
			if !errors.Is(err, os.ErrNotExist) {
				return nil, fmt.Errorf("failed to get input device: %v", err)
			}

			// Stop if we run out of devices (no such file/directory)
			break
		}
		devices = append(devices, device)
	}

	return devices, nil
}

// read reads an event from the device.
func (d *linuxDevice) read(e *event) error {
	if d.handle == nil {
		return fmt.Errorf("device not open")
	}

	buffer := make([]byte, unsafe.Sizeof(*e))
	_, err := d.handle.Read(buffer)
	if err != nil {
		return err
	}

	if isLittleEndian() {
		err = binary.Read(bytes.NewBuffer(buffer), binary.LittleEndian, e)
	} else {
		err = binary.Read(bytes.NewBuffer(buffer), binary.BigEndian, e)
	}
	if err != nil {
		return err
	}

	return nil
}

// open opens the device for reading.
func (d *linuxDevice) open() error {
	if d.handle != nil {
		return errors.New("device already open")
	}

	handle, err := os.Open(d.Path)
	if err != nil {
		return err
	}

	d.handle = handle
	return nil
}

// close closes the device.
func (d *linuxDevice) close() error {
	if d.handle == nil {
		return errors.New("device not open")
	}
	d.handle.Close()
	d.handle = nil
	return nil
}

// attachChannel listens for events on the device and writes them to the channel.
func (d *linuxDevice) attachChannel(ctx context.Context, eventChan chan event) error {
	err := d.open()
	if err != nil {
		return fmt.Errorf("error opening device: %v", err)
	}

	const maxRetries = 5
	var numRetries int

	go func() {
		defer d.close()
		defer close(eventChan)

		for {
			if ctx.Err() != nil {
				return
			}

			var event event
			err := d.read(&event)
			if err != nil {
				if numRetries >= maxRetries {
					return
				}

				numRetries++
				time.Sleep(100 * time.Millisecond)
				continue
			}

			numRetries = 0
			eventChan <- event
		}
	}()

	return nil
}

// isLittleEndian returns true if the system is little endian.
func isLittleEndian() bool {
	var i int32 = 0x01020304
	u := unsafe.Pointer(&i)
	pb := (*byte)(u)
	b := *pb
	return b == 0x04
}

// readBitMasks reads the bit masks from the file at the given path.
func readBitMasks(path string) ([]*big.Int, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	parts := strings.Fields(string(data))

	segments := []*big.Int{}

	for _, part := range parts {
		segment := new(big.Int)
		_, ok := segment.SetString(part, 16)
		if !ok {
			return nil, fmt.Errorf("failed to parse hex segment: %s", part)
		}

		segments = append(segments, segment)
	}

	if isLittleEndian() {
		reversedSegments := []*big.Int{}
		for i := len(segments) - 1; i >= 0; i-- {
			reversedSegments = append(reversedSegments, segments[i])
		}
		segments = reversedSegments
	}

	return segments, nil
}
