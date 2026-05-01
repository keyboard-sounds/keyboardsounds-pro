package main

import (
	"log/slog"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
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

	slog.Info("Setting audio pan", "panType", app.PanTypeKeyPosition, "maxX", 18)
	kbsApp.SetKeyboardAudioPan(true, app.PanTypeKeyPosition, 18)

	slog.Info("Waiting for terminate...")
	select {}
}
