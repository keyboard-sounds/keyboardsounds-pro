package main

import (
	"log"
	"log/slog"
	"runtime"
	"time"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/oskhelpers"
)

func main() {
	// Pin main goroutine to the main OS thread so RunMainLoop() runs the Cocoa main run loop
	// and dispatch_get_main_queue blocks are serviced.
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	helper, err := oskhelpers.New()
	if err != nil {
		log.Fatal(err)
	}

	// On macOS the run loop must run on the main thread; run the demo in a goroutine so dispatch blocks get processed.
	go func() {
		err := helper.SetOnScreenText(oskhelpers.OSKHelperConfig{
			FontSize:          36,
			FontColor:         "#F00000",
			BackgroundColor:   "#D0D0D0",
			BackgroundOpacity: 255,
			CornerRadius:      16,
			Position:          oskhelpers.OSKPositionBottom,
			Offset:            64,
		}, "Hello, world! But this is a longer text to test wrapping or going off the screen.")
		if err != nil {
			log.Fatal(err)
		}

		slog.Info("Waiting 5 seconds...")
		time.Sleep(5 * time.Second)

		err = helper.SetOnScreenText(oskhelpers.OSKHelperConfig{
			FontSize:          72,
			FontColor:         "#FFFFFF",
			BackgroundColor:   "#000000",
			BackgroundOpacity: 200,
			CornerRadius:      32,
			Position:          oskhelpers.OSKPositionTop,
			Offset:            32,
		}, "This is some shorter text with more opacity and more corner radius.")
		if err != nil {
			log.Fatal(err)
		}

		slog.Info("Waiting 5 seconds...")
		time.Sleep(5 * time.Second)

		err = helper.SetOnScreenText(oskhelpers.OSKHelperConfig{
			FontSize:          72,
			FontColor:         "#FFFFFF",
			BackgroundColor:   "#000000",
			BackgroundOpacity: 0,
			Position:          oskhelpers.OSKPositionTop,
			Offset:            32,
		}, "Hello, world! 2")
		if err != nil {
			log.Fatal(err)
		}

		slog.Info("Waiting 5 seconds...")
		time.Sleep(5 * time.Second)

		slog.Info("Clearing on screen text...")
		_ = helper.ClearOnScreenText()

		slog.Info("Demo done. On macOS, RunMainLoop blocks; press Ctrl+C to exit.")
	}()

	// On macOS, RunMainLoop must run on the main thread so the OSK overlay works.
	oskhelpers.RunMainLoop()
}
