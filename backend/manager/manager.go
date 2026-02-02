package manager

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/audio"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/hotkeys"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/key"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/oskhelpers"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/profile"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
	"github.com/samber/lo"
)

var (
	// ErrNoProfileSet is returned when no profile is set.
	ErrNoProfileSet = fmt.Errorf("no profile set")
	// ErrAlreadyEnabled is returned when the manager is already enabled.
	ErrAlreadyEnabled = fmt.Errorf("manager is already enabled")
	// ErrNotEnabled is returned when the manager is not enabled.
	ErrNotEnabled = fmt.Errorf("manager is not enabled")
	// ErrListenerNotImplemented is returned when the listener is not implemented for the current platform.
	ErrListenerNotImplemented = fmt.Errorf("listener not implemented for this platform")
)

// Manager is the main manager for the Keyboard Sounds backend.
// When enabled, the manager will asynchronously listen for keyboard and mouse events.
// When an event is received, the manager will play the corresponding audio
// file based on the current profile, configured application rules and effects.
type Manager struct {
	// The root directory for the manager
	rootDir string

	// Whether the manager is enabled
	enabled bool
	// Lock for the enabled state
	enabledLock sync.RWMutex

	// Context and cancel function for managing the listener lifecycle
	listenerCtx    context.Context
	listenerCancel context.CancelFunc
	// Wait group to track the event worker goroutine
	eventWorkerWg sync.WaitGroup

	// Audio Player
	audioPlayer audio.AudioPlayer
	// The keyboard volume for the audio player
	keyboardVolume float64
	// Lock for the keyboard volume
	keyboardVolumeLock sync.RWMutex
	// The last keyboard volume
	lastKeyboardVolume float64
	// Lock for the last keyboard volume
	lastKeyboardVolumeLock sync.RWMutex
	// The mouse volume for the audio player
	mouseVolume float64
	// Lock for the mouse volume
	mouseVolumeLock sync.RWMutex
	// The last mouse volume
	lastMouseVolume float64
	// Lock for the last mouse volume
	lastMouseVolumeLock sync.RWMutex

	// Effects Configs
	keyboardPitchShiftConfig managerPitchShiftConfig
	keyboardPanConfig        managerPanConfig
	keyboardEqualizerConfig  managerEqualizerConfig
	keyboardDopplerConfig    managerDopplerConfig
	mousePitchShiftConfig    managerPitchShiftConfig
	mousePanConfig           managerPanConfig
	mouseEqualizerConfig     managerEqualizerConfig
	mouseDopplerConfig       managerDopplerConfig

	// Keyboard Listener
	keyboardListener listener.KeyboardListener
	// The current keyboard profile
	keyboardProfile *profile.Profile
	// Lock for the keyboard profile
	keyboardProfileLock sync.RWMutex
	// The sources for the current keyboard profile
	keyboardProfileSources map[string]profile.SourceConfig
	// The cached audio files for the current profile.
	keyboardProfileAudioCache map[string]*audio.Audio
	// The keys that are currently down
	keyboardKeysDown []key.Key
	// Lock for the keyboard keys down
	keyboardKeysDownLock sync.RWMutex

	oskHelperLock    sync.RWMutex
	oskHelperEnabled bool
	oskHelper        oskhelpers.OSKHelper
	oskHelperConfig  oskhelpers.OSKHelperConfig

	// Mouse Listener
	mouseListener listener.MouseListener
	// The current mouse profile
	mouseProfile *profile.Profile
	// Lock for the mouse profile
	mouseProfileLock sync.RWMutex
	// The sources for the current mouse profile
	mouseProfileSources map[string]profile.SourceConfig
	// The cached audio files for the current profile.
	mouseProfileAudioCache map[string]*audio.Audio

	// The application focus detector
	focusDetector rules.FocusDetector
	// Current profiles for mouse and keyboard
	currentProfiles rules.Profiles
	// Lock for the current profiles
	currentProfilesLock sync.RWMutex
}

// NewManager creates a new manager. It initializes the audio player, keyboard listener, mouse listener, and focus detector.
// It also loads the profiles and rules from the configuration directory.
func NewManager(cfgDir string) (*Manager, error) {
	profile.SetProfilesDir(filepath.Join(cfgDir, "profiles"))

	err := profile.LoadProfiles()
	if err != nil {
		return nil, fmt.Errorf("failed to load profiles: %w", err)
	}

	err = rules.LoadRules(cfgDir)
	if err != nil {
		if !errors.Is(err, rules.ErrPlatformNotSupported) {
			return nil, fmt.Errorf("failed to load rules: %w", err)
		}

		slog.Warn("application rules disabled", "error", err)
	}

	err = hotkeys.LoadHotKeys(cfgDir)
	if err != nil {
		return nil, fmt.Errorf("failed to load hotkeys: %w", err)
	}

	defaultProfiles := rules.GetDefaultProfiles()

	var (
		keyboardProfile *profile.Profile
		mouseProfile    *profile.Profile
	)

	if defaultProfiles.Keyboard != nil {
		kbp, ok := profile.FindProfileByName(*defaultProfiles.Keyboard)
		if !ok {
			return nil, fmt.Errorf("failed to find default keyboard profile")
		}
		if kbp == nil {
			return nil, fmt.Errorf("failed to find default keyboard profile")
		}
		if kbp.Details.DeviceType != profile.DeviceTypeKeyboard {
			return nil, fmt.Errorf("default keyboard profile is not a keyboard profile")
		}
		keyboardProfile = kbp
	}
	if defaultProfiles.Mouse != nil {
		mmp, ok := profile.FindProfileByName(*defaultProfiles.Mouse)
		if !ok {
			return nil, fmt.Errorf("failed to find default mouse profile")
		}
		if mmp == nil {
			return nil, fmt.Errorf("failed to find default mouse profile")
		}
		if mmp.Details.DeviceType != profile.DeviceTypeMouse {
			return nil, fmt.Errorf("default mouse profile is not a mouse profile")
		}
		mouseProfile = mmp
	}

	oskHelper, err := oskhelpers.New()
	if err != nil {
		return nil, fmt.Errorf("failed to create osk helper: %w", err)
	}

	// Initialize default OSK Helper config
	defaultOSKConfig := oskhelpers.OSKHelperConfig{
		FontSize:          24,
		FontColor:         "#FFFFFF",
		BackgroundColor:   "#000000",
		BackgroundOpacity: 200,
		CornerRadius:      12,
		Position:          oskhelpers.OSKPositionBottom,
		Offset:            20,
		DismissAfter:      1000 * time.Millisecond,
	}

	mgr := &Manager{
		rootDir:          cfgDir,
		enabled:          false,
		audioPlayer:      audio.NewAudioPlayer(),
		keyboardListener: listener.NewKeyboardListener(),
		mouseListener:    listener.NewMouseListener(),
		focusDetector:    rules.NewFocusDetector(),
		oskHelper:        oskHelper,
		oskHelperConfig:  defaultOSKConfig,
		currentProfiles:  defaultProfiles,
		keyboardVolume:   1.0,
		mouseVolume:      1.0,
	}

	mgr.setKeyboardProfile(keyboardProfile)
	mgr.setMouseProfile(mouseProfile)

	registerHotKeyDelegate()
	registerToggleMuteAllHotKeyHandler(mgr)
	registerToggleMuteKeyboardHotKeyHandler(mgr)
	registerToggleMuteMouseHotKeyHandler(mgr)
	registerMuteAllHotKeyHandler(mgr)
	registerUnmuteAllHotKeyHandler(mgr)
	registerMuteKeyboardHotKeyHandler(mgr)
	registerUnmuteKeyboardHotKeyHandler(mgr)
	registerMuteMouseHotKeyHandler(mgr)
	registerUnmuteMouseHotKeyHandler(mgr)
	registerIncreaseVolumeAllHotKeyHandler(mgr)
	registerDecreaseVolumeAllHotKeyHandler(mgr)
	registerIncreaseVolumeKeyboardHotKeyHandler(mgr)
	registerDecreaseVolumeKeyboardHotKeyHandler(mgr)
	registerIncreaseVolumeMouseHotKeyHandler(mgr)
	registerDecreaseVolumeMouseHotKeyHandler(mgr)

	return mgr, nil
}

// Enable starts the manager. If the manager is already enabled, it will return
// an ErrAlreadyEnabled error.
func (m *Manager) Enable() error {
	m.enabledLock.Lock()
	defer m.enabledLock.Unlock()

	// Already enabled, return early.
	if m.enabled {
		return ErrAlreadyEnabled
	}

	// Listener not implemented, return early.
	if m.keyboardListener == nil {
		return ErrListenerNotImplemented
	}

	// Create a new context for this enable cycle
	m.listenerCtx, m.listenerCancel = context.WithCancel(context.Background())

	// Start listening for keyboard events.
	err := m.keyboardListener.Listen(m.listenerCtx)
	if err != nil {
		m.listenerCancel()
		m.listenerCtx = nil
		m.listenerCancel = nil
		return err
	}

	// Start the event worker.
	m.eventWorkerWg.Add(1)
	go m.keyboardEventWorker()

	// Start listening for mouse events if mouse profile is set.
	if m.mouseListener != nil {
		err = m.mouseListener.Listen(m.listenerCtx)
		if err != nil {
			slog.Warn("Failed to start mouse listener", "error", err)
			// Don't fail the entire enable if mouse listener fails
		} else {
			// Start the mouse event worker
			m.eventWorkerWg.Add(1)
			go m.mouseEventWorker()
		}
	}

	// Start the focus detector if available (Windows only)
	if m.focusDetector != nil {
		err = m.focusDetector.Listen(m.listenerCtx)
		if err != nil {
			slog.Warn("Failed to start focus detector", "error", err)
			// Don't fail the entire enable if focus detector fails
		} else {
			// Start the focus event worker
			m.eventWorkerWg.Add(1)
			go m.focusEventWorker()
		}
	}

	m.enabled = true
	return nil
}

// Disable stops the manager if it is running. If the manager is not enabled, it
// will return an ErrNotEnabled error.
func (m *Manager) Disable() error {
	m.enabledLock.Lock()
	defer m.enabledLock.Unlock()

	// Not enabled, return early.
	if !m.enabled {
		return ErrNotEnabled
	}

	// Cancel the context to stop the listener
	if m.listenerCancel != nil {
		m.listenerCancel()
	}

	// Wait for the event worker goroutine to finish
	m.eventWorkerWg.Wait()

	// Clean up context
	m.listenerCtx = nil
	m.listenerCancel = nil

	m.enabled = false
	return nil
}

// IsEnabled returns true if the manager is enabled.
func (m *Manager) IsEnabled() bool {
	m.enabledLock.RLock()
	defer m.enabledLock.RUnlock()

	return m.enabled
}

// GetRootDir returns the root directory for the manager.
func (m *Manager) GetRootDir() string {
	return m.rootDir
}

// SetDefaultProfiles sets the default profiles for the manager. If the manager is currently using the default profiles,
// the in memory values will be updated immediately. Otherwise, they will be updated the next time that the focus listener
// is triggered by an app being focused.
func (m *Manager) SetDefaultProfiles(profiles rules.Profiles) error {
	err := rules.SetDefaultProfiles(profiles)
	if err != nil {
		return fmt.Errorf("failed to set default profiles: %w", err)
	}

	m.currentProfilesLock.RLock()
	isDefault := m.currentProfiles.IsDefault
	m.currentProfilesLock.RUnlock()

	// If we are currently using the default profiles, we should update their
	// in memory values immediately. Otherwise, they will be updated the next
	// time that the focus listener is triggered by an app being focused.
	if isDefault {
		m.updateProfiles(profiles)
	}

	return nil
}

// setKeyboardProfile sets the keyboard profile for the manager.
// It loads the audio files for the profile into memory.
func (m *Manager) setKeyboardProfile(p *profile.Profile) error {
	m.keyboardProfileLock.Lock()
	defer m.keyboardProfileLock.Unlock()

	if p == nil {
		m.keyboardProfile = nil
		m.keyboardProfileSources = nil
		m.keyboardProfileAudioCache = nil
		return nil
	}

	if p.Details.DeviceType != profile.DeviceTypeKeyboard {
		return fmt.Errorf("profile is not a keyboard profile: %s", p.Details.DeviceType)
	}

	// Loud sources
	profileSources := make(map[string]profile.SourceConfig, len(p.Sources))
	audioFiles := make([]string, 0)
	for _, source := range p.Sources {
		sourceConfig, err := source.GetSourceConfig()
		if err != nil {
			return fmt.Errorf(
				"failed to get source config for source %s: %w", source.ID, err)
		}

		profileSources[source.ID] = sourceConfig

		if sourceConfig.Press != nil {
			audioFiles = append(audioFiles, *sourceConfig.Press)
		}

		if sourceConfig.Release != nil {
			audioFiles = append(audioFiles, *sourceConfig.Release)
		}

		audioFiles = lo.Uniq(audioFiles)
	}

	// Load audio files
	audioCache := make(map[string]*audio.Audio, len(audioFiles))
	for _, fileName := range audioFiles {
		audioFormat, err := audio.AudioFormatForFile(fileName)
		if err != nil {
			return fmt.Errorf("failed to get audio format for file %s: %w", fileName, err)
		}

		filePath := filepath.Join(p.Location, fileName)
		audioFile, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("failed to open audio file %s: %w", filePath, err)
		}
		defer audioFile.Close()

		audio, err := audio.NewAudio(audioFormat, audioFile)
		if err != nil {
			return fmt.Errorf("failed to load audio file %s: %w", filePath, err)
		}

		audioCache[fileName] = audio
	}

	m.keyboardProfile = p
	m.keyboardProfileSources = profileSources
	m.keyboardProfileAudioCache = audioCache

	return nil
}

// setMouseProfile sets the mouse profile for the manager.
// It loads the audio files for the profile into memory.
func (m *Manager) setMouseProfile(p *profile.Profile) error {
	m.mouseProfileLock.Lock()
	defer m.mouseProfileLock.Unlock()

	if p == nil {
		m.mouseProfile = nil
		m.mouseProfileSources = nil
		m.mouseProfileAudioCache = nil
		return nil
	}

	if p.Details.DeviceType != profile.DeviceTypeMouse {
		return fmt.Errorf("profile is not a mouse profile: %s", p.Details.DeviceType)
	}

	// Load sources
	profileSources := make(map[string]profile.SourceConfig, len(p.Sources))
	audioFiles := make([]string, 0)
	for _, source := range p.Sources {
		sourceConfig, err := source.GetSourceConfig()
		if err != nil {
			return fmt.Errorf(
				"failed to get source config for source %s: %w", source.ID, err)
		}

		profileSources[source.ID] = sourceConfig

		if sourceConfig.Press != nil {
			audioFiles = append(audioFiles, *sourceConfig.Press)
		}

		if sourceConfig.Release != nil {
			audioFiles = append(audioFiles, *sourceConfig.Release)
		}

		audioFiles = lo.Uniq(audioFiles)
	}

	// Load audio files
	audioCache := make(map[string]*audio.Audio, len(audioFiles))
	for _, fileName := range audioFiles {
		audioFormat, err := audio.AudioFormatForFile(fileName)
		if err != nil {
			return fmt.Errorf("failed to get audio format for file %s: %w", fileName, err)
		}

		filePath := filepath.Join(p.Location, fileName)
		audioFile, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("failed to open audio file %s: %w", filePath, err)
		}
		defer audioFile.Close()

		audio, err := audio.NewAudio(audioFormat, audioFile)
		if err != nil {
			return fmt.Errorf("failed to load audio file %s: %w", filePath, err)
		}

		audioCache[fileName] = audio
	}

	m.mouseProfile = p
	m.mouseProfileSources = profileSources
	m.mouseProfileAudioCache = audioCache

	return nil
}

func (m *Manager) SetOSKHelperEnabled(enabled bool) {
	m.oskHelperLock.Lock()
	defer m.oskHelperLock.Unlock()

	m.oskHelperEnabled = enabled
}

func (m *Manager) GetOSKHelperEnabled() bool {
	m.oskHelperLock.RLock()
	defer m.oskHelperLock.RUnlock()

	return m.oskHelperEnabled
}

func (m *Manager) SetOSKHelperConfig(config oskhelpers.OSKHelperConfig) {
	m.oskHelperLock.Lock()
	defer m.oskHelperLock.Unlock()

	m.oskHelperConfig = config
}

func (m *Manager) GetOSKHelperConfig() oskhelpers.OSKHelperConfig {
	m.oskHelperLock.RLock()
	defer m.oskHelperLock.RUnlock()
	return m.oskHelperConfig
}
