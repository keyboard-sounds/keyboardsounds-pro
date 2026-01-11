package audio

import (
	"fmt"
	"io"
	"sync"
	"time"

	beep "github.com/gopxl/beep/v2"
	"github.com/gopxl/beep/v2/mp3"
	"github.com/gopxl/beep/v2/speaker"
	"github.com/gopxl/beep/v2/wav"
)

// Audio represents an audio file.
type Audio struct {
	buffer *beep.Buffer
}

// NewAudio creates a new audio file from a given format and file.
func NewAudio(formatType AudioFormat, file io.ReadCloser) (*Audio, error) {
	var (
		streamer beep.StreamSeekCloser
		format   beep.Format
		err      error
	)

	switch formatType {
	case MP3:
		streamer, format, err = mp3.Decode(file)
	case WAV:
		streamer, format, err = wav.Decode(file)
	default:
		return nil, fmt.Errorf("invalid audio format: %s", formatType)
	}

	if err != nil {
		return nil, err
	}

	defer streamer.Close()

	var finalStreamer beep.Streamer = streamer
	if format.SampleRate != sampleRate {
		finalStreamer = beep.Resample(4, format.SampleRate, sampleRate, streamer)
	}

	buffer := beep.NewBuffer(format)
	buffer.Append(finalStreamer)

	return &Audio{buffer}, nil
}

// AudioPlayer is an interface for playing audio files.
type AudioPlayer interface {
	// Play plays the audio file for the given audio. It should be non-blocking, and can potentially return an error before
	// triggering the asynchronous playback.
	Play(audio *Audio, effects EffectsConfig) error
}

// Buffer duration for the speaker (10ms provides low latency)
const bufferDuration = time.Second / 10

type audioPlayerImpl struct {
	initialized bool
	initMutex   sync.Mutex
}

// NewAudioPlayer creates a new audio player instance
func NewAudioPlayer() AudioPlayer {
	return &audioPlayerImpl{}
}

// ensureInitialized initializes the speaker if it hasn't been initialized yet.
// This is thread-safe and will only initialize once.
func (a *audioPlayerImpl) ensureInitialized() error {
	a.initMutex.Lock()
	defer a.initMutex.Unlock()

	if a.initialized {
		return nil
	}

	err := speaker.Init(sampleRate, sampleRate.N(bufferDuration))
	if err != nil {
		return err
	}

	a.initialized = true
	return nil
}

func (a *audioPlayerImpl) Play(audio *Audio, effects EffectsConfig) error {
	// Ensure speaker is initialized (thread-safe, only initializes once)
	if err := a.ensureInitialized(); err != nil {
		return err
	}

	var streamer beep.Streamer = audio.buffer.Streamer(0, audio.buffer.Len())

	// Apply effects to streamer.
	for _, effect := range registeredEffects {
		streamer = effect.Apply(effects, streamer)
	}

	// Play the audio - speaker.Play is non-blocking and supports simultaneous playback
	speaker.Play(streamer)

	return nil
}
