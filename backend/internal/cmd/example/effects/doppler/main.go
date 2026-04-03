package main

import (
	"log/slog"
	"time"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/audio"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/app"
)

func main() {
	kbsApp, err := app.NewApp(kbs.GetHomeDirectory())
	if err != nil {
		panic(err)
	}

	slog.Info("Enabling application")
	err = kbsApp.Enable()
	if err != nil {
		panic(err)
	}

	time.Sleep(5 * time.Second)

	slog.Info("Setting audio doppler", "quality", audio.DopplerQualityHigh, "distance", 10.0, "velocity", 0.0)
	kbsApp.SetKeyboardAudioDoppler(true, audio.DopplerConfig{
		Quality:  audio.DopplerQualityHigh,
		Distance: 2.0,
		Velocity: -1.0,
	})

	slog.Info("Waiting for terminate...")
	select {}
}
