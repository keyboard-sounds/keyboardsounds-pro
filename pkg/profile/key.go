package profile

// Key represents a key definition in the Other section of a profile.
type Key struct {
	// The source to play for events corresponding to the keys listed in the Keys field.
	// This should correspond to the source ID in the profile sources.
	Sound any `yaml:"sound"`
	// The keys that trigger this sound source.
	Keys *[]string `yaml:"keys,omitempty"`
}

// Keys represents a list of keys in a profile.
type Keys struct {
	// The default source to use for any key that is not defined in the Other section.
	// This should correspond to the source ID in the profile sources.
	Default []string `yaml:"default"`
	// The other keys that trigger a specific sound source.
	Other []Key `yaml:"other"`
}
