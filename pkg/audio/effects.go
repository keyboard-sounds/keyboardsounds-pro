package audio

import (
	beep "github.com/gopxl/beep/v2"
)

// Common sample rate for all audio playback
// 44100 Hz is a standard sample rate that works well for most audio
const sampleRate = beep.SampleRate(44100)

var registeredEffects = make([]Effect, 0)

func registerEffect(name string, effect Effect) {
	registeredEffects = append(registeredEffects, effect)
}

// Effect is an interface for an audio effect.
type Effect interface {
	// Apply applies the effect to the given streamer.
	Apply(config EffectsConfig, streamer beep.Streamer) beep.Streamer
}
