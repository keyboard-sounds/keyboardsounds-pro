package audio

import (
	beep "github.com/gopxl/beep/v2"
	"github.com/gopxl/beep/v2/effects"
)

func init() {
	registerEffect("pan", &PanEffect{})
}

type PanConfig struct {
	Pan float64 `json:"pan"`
}

type PanEffect struct{}

func (e *PanEffect) Apply(cfg EffectsConfig, streamer beep.Streamer) beep.Streamer {
	if cfg.Pan == nil {
		return streamer
	}

	return &effects.Pan{
		Streamer: streamer,
		Pan:      cfg.Pan.Pan,
	}
}
