package audio

import (
	"math"

	beep "github.com/gopxl/beep/v2"
	"github.com/gopxl/beep/v2/effects"
)

func init() {
	registerEffect("volume", &VolumeEffect{})
}

// VolumeConfig represents the configuration for the volume effect.
type VolumeConfig struct {
	Volume float64 `json:"volume"`
}

// VolumeEffect represents the volume effect.
type VolumeEffect struct{}

// Apply applies the volume effect to the given streamer.
func (v *VolumeEffect) Apply(cfg EffectsConfig, streamer beep.Streamer) beep.Streamer {
	if cfg.Volume == nil {
		return streamer
	}

	vol := cfg.Volume.Volume
	if vol <= 0 {
		return &effects.Volume{
			Streamer: streamer,
			Base:     2,
			Volume:   0,
			Silent:   true,
		}
	}

	return &effects.Volume{
		Streamer: streamer,
		Base:     2,
		Volume:   math.Log2(vol),
		Silent:   false,
	}
}
