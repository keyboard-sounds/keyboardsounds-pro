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

	slog.Info("Setting audio pan", "panType", manager.PanTypeKeyPosition, "maxX", 18)
	mgr.SetKeyboardAudioPan(true, manager.PanTypeKeyPosition, 18)

	slog.Info("Waiting for terminate...")
	select {}
}
