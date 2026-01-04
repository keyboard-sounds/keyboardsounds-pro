package audio

import (
	"fmt"
	"path/filepath"
	"strings"
)

// AudioFormat represents the format of an audio file.
type AudioFormat string

var (
	// MP3 is the audio format for MP3 files.
	MP3 AudioFormat = "mp3"
	// WAV is the audio format for WAV files.
	WAV AudioFormat = "wav"
)

// AudioFormatForFile returns the audio format for a given file path.
func AudioFormatForFile(filePath string) (AudioFormat, error) {
	ext := strings.ToLower(filepath.Ext(filePath))
	switch ext {
	case ".mp3":
		return MP3, nil
	case ".wav":
		return WAV, nil
	default:
		return "", fmt.Errorf("invalid audio format: %s", ext)
	}
}
