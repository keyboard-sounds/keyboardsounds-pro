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

	slog.Info("Setting pitch shift to -2,2")
	mgr.SetKeyboardAudioPitchShift(true, -2, 2)

	slog.Info("Waiting for terminate...")
	select {}
}
