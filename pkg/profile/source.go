package profile

import "fmt"

// SourceConfig represents the configuration of a source.
type SourceConfig struct {
	// The audio file to play when the key is pressed.
	Press *string `yaml:"press"`
	// The audio file to play when the key is released.
	Release *string `yaml:"release"`
}

// Source represents a source in a profile.
type Source struct {
	// The ID of the source.
	ID string `yaml:"id"`
	// The source configuration.
	Source any `yaml:"source"`
}

// GetSourceConfig gets the source configuration for a source.
func (s *Source) GetSourceConfig() (SourceConfig, error) {
	switch s.Source.(type) {
	case string:
		srcString := s.Source.(string)
		return SourceConfig{
			Press:   &srcString,
			Release: nil,
		}, nil
	case map[any]any:
		sourceConfig := s.Source.(map[any]any)

		var (
			press   *string
			release *string
		)

		if pressAny, ok := sourceConfig["press"]; ok {
			if pressStr, ok := pressAny.(string); ok {
				press = &pressStr
			}
		}

		if releaseAny, ok := sourceConfig["release"]; ok {
			if releaseStr, ok := releaseAny.(string); ok {
				release = &releaseStr
			}
		}

		return SourceConfig{
			Press:   press,
			Release: release,
		}, nil
	default:
		return SourceConfig{}, fmt.Errorf("invalid source type: %T", s.Source)
	}
}
