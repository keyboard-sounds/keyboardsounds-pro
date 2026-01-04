package audio

import (
	beep "github.com/gopxl/beep/v2"
	"github.com/gopxl/beep/v2/effects"
)

func init() {
	registerEffect("pan", &PanEffect{})
}

// PanConfig represents the configuration for the pan effect.
type PanConfig struct {
	// The pan value (-1.0 to 1.0)
	Pan float64 `json:"pan"`
}

// PanEffect represents the pan effect.
type PanEffect struct{}

// Apply applies the pan effect to the given streamer.
func (e *PanEffect) Apply(cfg EffectsConfig, streamer beep.Streamer) beep.Streamer {
	if cfg.Pan == nil {
		return streamer
	}

	return &effects.Pan{
		Streamer: streamer,
		Pan:      cfg.Pan.Pan,
	}
}
