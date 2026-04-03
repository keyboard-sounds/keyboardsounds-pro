package main

import (
	"log/slog"
	"time"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/app"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
	"github.com/samber/lo"
)

func main() {
	kbsApp, err := app.NewApp(kbs.GetHomeDirectory())
	if err != nil {
		panic(err)
	}

	err = kbsApp.Enable()
	if err != nil {
		panic(err)
	}

	slog.Info("Application enabled")

	time.Sleep(5 * time.Second)
	err = kbsApp.SetDefaultProfiles(rules.Profiles{
		Keyboard: lo.ToPtr("logitech-g915-tkl-brown"),
		Mouse:    lo.ToPtr("g502x-wireless"),
	})
	if err != nil {
		panic(err)
	}

	slog.Info("Set profiles to logitech-g915-tkl-brown and g502x-wireless")

	select {}
}
