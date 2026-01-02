package profile

type Button struct {
	Sound   any       `yaml:"sound"`
	Buttons *[]string `yaml:"buttons,omitempty"`
}

type Buttons struct {
	Default string   `yaml:"default"`
	Other   []Button `yaml:"other"`
}
