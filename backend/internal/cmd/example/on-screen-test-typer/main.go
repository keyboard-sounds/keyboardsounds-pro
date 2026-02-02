package main

import (
	"log/slog"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/manager"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/oskhelpers"
)

func main() {
	mgr, err := manager.NewManager(kbs.GetHomeDirectory())
	if err != nil {
		panic(err)
	}

	mgr.SetOSKHelperEnabled(true)
	mgr.SetOSKHelperConfig(oskhelpers.OSKHelperConfig{
		FontSize:          48,
		FontColor:         "#FFFFFF",
		BackgroundColor:   "#000000",
		BackgroundOpacity: 128,
		CornerRadius:      10,
		Position:          oskhelpers.OSKPositionBottom,
		Offset:            32,
	})

	slog.Info("Enabling manager")
	err = mgr.Enable()
	if err != nil {
		panic(err)
	}

	slog.Info("Waiting for terminate...")
	select {}
}
