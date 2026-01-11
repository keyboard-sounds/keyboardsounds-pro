package main

import (
	"bytes"
	"context"
	"io"
	"log/slog"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/audio"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/key"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener/listenertypes"

	_ "embed"
)

//go:embed press.mp3
var pressMP3 []byte

//go:embed release.wav
var releaseWAV []byte

func main() {
	press, err := audio.NewAudio(audio.MP3, io.NopCloser(bytes.NewReader(pressMP3)))
	if err != nil {
		panic(err)
	}

	release, err := audio.NewAudio(audio.WAV, io.NopCloser(bytes.NewReader(releaseWAV)))
	if err != nil {
		panic(err)
	}

	audioPlayer := audio.NewAudioPlayer()

	listener := listener.NewKeyboardListener()
	if listener == nil {
		panic("listener not implemented for this platform")
	}

	listener.Listen(context.Background())

	events := listener.Events()

	go func() {
		for event := range events {
			pan := key.PanValueForKeyPosition(*event.Key.GetPosition(), 18)
			slog.Info("Event received", "event", event, "pan", pan)

			if event.Action == listenertypes.ActionPress {
				audioPlayer.Play(press, audio.EffectsConfig{
					Pan: &audio.PanConfig{
						Pan: pan,
					},
				})
			}

			if event.Action == listenertypes.ActionRelease {
				audioPlayer.Play(release, audio.EffectsConfig{
					Pan: &audio.PanConfig{
						Pan: pan,
					},
				})
			}
		}
	}()

	select {}
}
