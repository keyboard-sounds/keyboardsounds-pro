package audio

type EffectsConfig struct {
	// Pitch is the configuration for the pitch shift effect.
	Pitch *PitchConfig
	// Pan is the configuration for the pan effect.
	Pan *PanConfig
	// Equalizer is the configuration for the equalizer effect.
	Equalizer *EqualizerConfig
	// Doppler is the configuration for the doppler effect.
	Doppler *DopplerConfig
	// Volume is the configuration for the volume effect.
	Volume *VolumeConfig
}
