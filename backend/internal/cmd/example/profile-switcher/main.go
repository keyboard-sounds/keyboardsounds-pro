package main

import (
	"log/slog"
	"time"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/manager"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
	"github.com/samber/lo"
)

func main() {
	mgr, err := manager.NewManager(kbs.GetHomeDirectory())
	if err != nil {
		panic(err)
	}

	err = mgr.Enable()
	if err != nil {
		panic(err)
	}

	slog.Info("Manager enabled")

	time.Sleep(5 * time.Second)
	err = mgr.SetDefaultProfiles(rules.Profiles{
		Keyboard: lo.ToPtr("logitech-g915-tkl-brown"),
		Mouse:    lo.ToPtr("g502x-wireless"),
	})
	if err != nil {
		panic(err)
	}

	slog.Info("Set profiles to logitech-g915-tkl-brown and g502x-wireless")

	select {}
}
