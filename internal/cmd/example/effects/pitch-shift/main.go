package main

import (
	"log/slog"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/manager"
)

func main() {
	mgr, err := manager.NewManager("C:\\Users\\natef\\keyboardsounds-pro")
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
