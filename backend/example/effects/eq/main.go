package main

import (
	"log/slog"
	"time"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/audio"
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

	slog.Info("Setting EQ to Bass Boost")
	mgr.SetKeyboardAudioEqualizer(true, audio.EqualizerConfig{
		Hz60:  6,
		Hz170: 4,
		Hz310: 2,
		Hz600: 0,
		Hz1k:  0,
		Hz3k:  0,
		Hz6k:  -1,
		Hz12k: -2,
		Hz14k: -2,
		Hz16k: -2,
	})

	time.Sleep(5 * time.Second)

	slog.Info("Setting EQ to Treble Boost")
	mgr.SetKeyboardAudioEqualizer(true, audio.EqualizerConfig{
		Hz60:  -2,
		Hz170: -1,
		Hz310: 0,
		Hz600: 0,
		Hz1k:  1,
		Hz3k:  3,
		Hz6k:  5,
		Hz12k: 6,
		Hz14k: 5,
		Hz16k: 4,
	})

	time.Sleep(5 * time.Second)
	mgr.SetKeyboardAudioEqualizer(false, audio.EqualizerConfig{})

	slog.Info("Waiting for terminate...")
	select {}
}
