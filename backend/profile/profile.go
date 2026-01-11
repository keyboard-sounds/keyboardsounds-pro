package profile

type DeviceType string

const (
	DeviceTypeKeyboard DeviceType = "keyboard"
	DeviceTypeMouse    DeviceType = "mouse"
)

// ProfileDetails represents the details of a profile.
type ProfileDetails struct {
	// The name of the profile.
	Name string `yaml:"name"`
	// The author of the profile.
	Author string `yaml:"author"`
	// The description of the profile.
	Description string `yaml:"description"`
	// The type of device for the profile.
	DeviceType DeviceType `yaml:"device"`
}

// Profile represents a profile.
type Profile struct {
	// The details of the profile.
	Details ProfileDetails `yaml:"profile"`
	// The sources of the profile.
	Sources []Source `yaml:"sources"`
	// The keys of the profile.
	Keys Keys `yaml:"keys"`
	// The buttons of the profile.
	Buttons Buttons `yaml:"buttons"`
	// The location of the profile.
	Location string `yaml:"-"`
}
