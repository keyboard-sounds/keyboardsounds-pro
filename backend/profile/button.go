package profile

// Button represents a button definition in the profile.
type Button struct {
	// The source to play for events corresponding to the buttons listed in the Buttons field.
	// This should correspond to the source ID in the profile sources.
	Sound any `yaml:"sound"`
	// The buttons that trigger this sound source.
	Buttons *[]string `yaml:"buttons,omitempty"`
}

// Buttons represents all mouse button definitions in the profile.
type Buttons struct {
	// The default source to use for any button that is not defined in the Other section.
	// This should correspond to the source ID in the profile sources.
	Default string `yaml:"default"`
	// The other buttons that trigger a specific sound source.
	Other []Button `yaml:"other"`
}
