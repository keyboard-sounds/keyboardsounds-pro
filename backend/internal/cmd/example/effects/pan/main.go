package main

import (
	"log/slog"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/manager"
)

func main() {
	mgr, err := manager.NewManager(kbs.GetHomeDirectory())
	if err != nil {
		panic(err)
	}

	slog.Info("Enabling manager")
	err = mgr.Enable()
	if err != nil {
		panic(err)
	}

	slog.Info("Setting audio pan", "panType", manager.PanTypeKeyPosition, "maxX", 18)
	mgr.SetKeyboardAudioPan(true, manager.PanTypeKeyPosition, 18)

	slog.Info("Waiting for terminate...")
	select {}
}
