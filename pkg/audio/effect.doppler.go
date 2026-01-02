package audio

import (
	beep "github.com/gopxl/beep/v2"
	"github.com/gopxl/beep/v2/effects"
)

func init() {
	registerEffect("doppler", &DopplerEffect{})
}

type DopplerQuality int

const (
	DopplerQualityLow  DopplerQuality = 1
	DopplerQualityHigh DopplerQuality = 2
)

type DopplerConfig struct {
	// The quality (either 1 or 2)
	Quality DopplerQuality
	// Distance in meters (0.1m to 50m)
	Distance float64
	// Velocity in m/s (-10.00 to 10.00 m/s)
	Velocity float64
}

func (c *DopplerConfig) Copy() *DopplerConfig {
	return &DopplerConfig{
		Quality:  c.Quality,
		Distance: c.Distance,
		Velocity: c.Velocity,
	}
}

type DopplerEffect struct{}

// speedOfSound is the speed of sound in m/s at 20°C
const speedOfSound = 343.0

func (e *DopplerEffect) Apply(cfg EffectsConfig, streamer beep.Streamer) beep.Streamer {
	if cfg.Doppler == nil {
		return streamer
	}

	quality := int(cfg.Doppler.Quality)
	if quality < 1 {
		quality = 1
	}
	if quality > 2 {
		quality = 2
	}

	// Calculate samples per meter: sampleRate / speed of sound
	samplesPerMeter := float64(sampleRate) / speedOfSound

	// Current distance starts at the configured distance
	currentDistance := cfg.Doppler.Distance
	if currentDistance < 0.1 {
		currentDistance = 0.1
	}

	velocity := cfg.Doppler.Velocity

	// Create the distance function that updates based on velocity
	// Positive velocity = moving away, negative velocity = moving towards
	distanceFunc := func(delta int) float64 {
		// Calculate time elapsed for these samples
		timeElapsed := float64(delta) / float64(sampleRate)

		// Update distance based on velocity
		currentDistance += velocity * timeElapsed

		// Clamp distance to minimum of 1 meter to avoid division issues
		if currentDistance < 0.1 {
			currentDistance = 0.1
		}

		return currentDistance
	}

	return effects.Doppler(quality, samplesPerMeter, streamer, distanceFunc)
}
