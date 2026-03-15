package main

import (
	"log/slog"
	"runtime"
	"time"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/manager"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/oskhelpers"
)

func main() {
	// Pin main goroutine to the main OS thread so RunMainLoop() runs the Cocoa main run loop
	// and the on-screen overlay can be shown from keyboard events.
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	mgr, err := manager.NewManager(kbs.GetHomeDirectory())
	if err != nil {
		panic(err)
	}

	mgr.SetOSKHelperEnabled(true)
	mgr.SetOSKHelperConfig(oskhelpers.OSKHelperConfig{
		FontSize:          72,
		FontColor:         "#FFFFFF",
		BackgroundColor:   "#000000",
		BackgroundOpacity: 128,
		CornerRadius:      10,
		Position:          oskhelpers.OSKPositionBottom,
		Offset:            48,
		DismissAfter:      5 * time.Second,
	})

	slog.Info("Enabling manager")
	err = mgr.Enable()
	if err != nil {
		panic(err)
	}

	slog.Info("Press modifier keys to see the on-screen display. Waiting for terminate...")
	// On macOS, RunMainLoop must run on the main thread so the OSK overlay can be updated from keyboard events.
	oskhelpers.RunMainLoop()
}
