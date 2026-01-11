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

	// Apply volume control using effects.Volume
	playbackVolume := 1.0
	if cfg.Volume.Volume < 1 && cfg.Volume.Volume > 0 {
		playbackVolume = math.Log2(cfg.Volume.Volume)
	}

	return &effects.Volume{
		Streamer: streamer,
		Base:     2,
		Volume:   playbackVolume,
		Silent:   cfg.Volume.Volume == 0,
	}
}
