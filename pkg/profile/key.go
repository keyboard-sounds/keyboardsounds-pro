package profile

// Key represents a key definition in the Other section of a profile.
type Key struct {
	// The sound to play when the key is pressed. This should correspond to the source ID in the profile sources.
	Sound any `yaml:"sound"`
	// The keys that trigger the sound.
	Keys *[]string `yaml:"keys,omitempty"`
}

// Keys represents a list of keys in a profile.
type Keys struct {
	// The default sources to use for keys that are not defined in the Other section.
	Default []string `yaml:"default"`
	// The other keys that trigger the sound.
	Other []Key `yaml:"other"`
}
