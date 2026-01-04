package audio

import (
	beep "github.com/gopxl/beep/v2"
	"github.com/gopxl/beep/v2/effects"
)

func init() {
	registerEffect("equalizer", &EqualizerEffect{})
}

// EqualizerConfig represents the configuration for the equalizer effect.
type EqualizerConfig struct {
	Hz60  float64 `json:"hz60"`
	Hz170 float64 `json:"hz170"`
	Hz310 float64 `json:"hz310"`
	Hz600 float64 `json:"hz600"`
	Hz1k  float64 `json:"hz1k"`
	Hz3k  float64 `json:"hz3k"`
	Hz6k  float64 `json:"hz6k"`
	Hz12k float64 `json:"hz12k"`
	Hz14k float64 `json:"hz14k"`
	Hz16k float64 `json:"hz16k"`
}

// Copy copies the equalizer configuration.
func (c *EqualizerConfig) Copy() *EqualizerConfig {
	return &EqualizerConfig{
		Hz60:  c.Hz60,
		Hz170: c.Hz170,
		Hz310: c.Hz310,
		Hz600: c.Hz600,
		Hz1k:  c.Hz1k,
		Hz3k:  c.Hz3k,
		Hz6k:  c.Hz6k,
		Hz12k: c.Hz12k,
		Hz14k: c.Hz14k,
		Hz16k: c.Hz16k,
	}
}

// EqualizerEffect represents the equalizer effect.
type EqualizerEffect struct{}

// Apply applies the equalizer effect to the given streamer.
func (e *EqualizerEffect) Apply(cfg EffectsConfig, streamer beep.Streamer) beep.Streamer {
	if cfg.Equalizer == nil {
		return streamer
	}

	eq := cfg.Equalizer

	// Define all possible equalizer bands
	// F0: center frequency, Bf: bandwidth, G: boost/cut gain in dB
	type band struct {
		f0 float64
		bf float64
		g  float64
	}
	bands := []band{
		{60, 40, eq.Hz60},
		{170, 100, eq.Hz170},
		{310, 180, eq.Hz310},
		{600, 350, eq.Hz600},
		{1000, 600, eq.Hz1k},
		{3000, 1800, eq.Hz3k},
		{6000, 3500, eq.Hz6k},
		{12000, 4000, eq.Hz12k},
		{14000, 3000, eq.Hz14k},
		{16000, 3000, eq.Hz16k},
	}

	// Only include bands with non-zero gain to avoid division by zero in beep's equalizer math
	sections := effects.MonoEqualizerSections{}
	for _, b := range bands {
		if b.g != 0 {
			sections = append(sections, effects.MonoEqualizerSection{
				F0: b.f0,
				Bf: b.bf,
				GB: b.g / 2, // bandwidth gain at half the boost/cut
				G0: 0,       // reference gain (unity)
				G:  b.g,     // boost/cut gain
			})
		}
	}

	// If no bands have gain applied, return the original streamer
	if len(sections) == 0 {
		return streamer
	}

	return effects.NewEqualizer(streamer, sampleRate, sections)
}
