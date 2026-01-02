package audio

type EffectsConfig struct {
	Pitch     *PitchConfig
	Pan       *PanConfig
	Equalizer *EqualizerConfig
	Doppler   *DopplerConfig
	Volume    *VolumeConfig
}
