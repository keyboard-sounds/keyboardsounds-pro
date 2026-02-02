package main

import (
	"log"
	"log/slog"
	"time"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/oskhelpers"
)

func main() {
	helper, err := oskhelpers.New()
	if err != nil {
		log.Fatal(err)
	}

	err = helper.SetOnScreenText(oskhelpers.OSKHelperConfig{
		FontSize:          36,
		FontColor:         "#FFFFFF",
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
	err = helper.ClearOnScreenText()
	if err != nil {
		log.Fatal(err)
	}

	slog.Info("Waiting for user to press Ctrl+C...")
	select {}
}
