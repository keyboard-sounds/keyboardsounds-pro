package audio

import (
	"math"
	"math/rand/v2"

	beep "github.com/gopxl/beep/v2"
)

func init() {
	registerEffect("pitch-shift", &PitchShiftEffect{})
}

type PitchConfig struct {
	SemitoneRange [2]float64 `json:"semitones"`
}

type PitchShiftEffect struct{}

func (e *PitchShiftEffect) Apply(cfg EffectsConfig, streamer beep.Streamer) beep.Streamer {
	if cfg.Pitch == nil {
		return streamer
	}

	// random value between the semitone range
	lower := cfg.Pitch.SemitoneRange[0]
	upper := cfg.Pitch.SemitoneRange[1]
	st := rand.Float64()*(upper-lower) + lower

	// Convert semitones to pitch ratio: ratio = 2^(semitones/12)
	pitchRatio := math.Pow(2, st/12.0)

	// Calculate the new sample rate for pitch shifting
	// Resampling at a different rate changes the pitch
	newSampleRate := beep.SampleRate(float64(sampleRate) * pitchRatio)

	// Apply resampling to shift the pitch
	return beep.Resample(4, sampleRate, newSampleRate, streamer)
}
