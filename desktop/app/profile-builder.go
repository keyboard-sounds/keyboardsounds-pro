package app

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/profile"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v2"
)

// ProfileBuilder is the Wails binding for the profile builder UI
type ProfileBuilder struct{}

// NewProfileBuilder creates a new ProfileBuilder instance
func NewProfileBuilder() *ProfileBuilder {
	return &ProfileBuilder{}
}

// AudioFile represents an audio file in the selected directory
type AudioFile struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

// DirectorySelection represents the result of selecting a directory
type DirectorySelection struct {
	Path       string      `json:"path"`
	AudioFiles []AudioFile `json:"audioFiles"`
}

// ProfileSource represents a sound source from the frontend
type ProfileSource struct {
	Name         string  `json:"name"`
	PressSound   string  `json:"pressSound"`
	ReleaseSound *string `json:"releaseSound"`
	IsDefault    bool    `json:"isDefault"`
}

// ProfileMetadata represents the profile metadata from the frontend
type ProfileMetadata struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Author      string `json:"author"`
}

// KeyboardBuildRequest represents the request to build a keyboard profile
type KeyboardBuildRequest struct {
	Metadata       ProfileMetadata     `json:"metadata"`
	Sources        []ProfileSource     `json:"sources"`
	KeyAssignments map[string][]string `json:"keyAssignments"`
	Directory      string              `json:"directory"`
}

// MouseBuildRequest represents the request to build a mouse profile
type MouseBuildRequest struct {
	Metadata         ProfileMetadata   `json:"metadata"`
	Sources          []ProfileSource   `json:"sources"`
	MouseAssignments map[string]string `json:"mouseAssignments"`
	Directory        string            `json:"directory"`
}

// BrowseForDirectory opens a directory dialog to select a folder containing audio files
func (pb *ProfileBuilder) BrowseForDirectory() (*DirectorySelection, error) {
	selection, err := runtime.OpenDirectoryDialog(ctx, runtime.OpenDialogOptions{
		Title: "Select Audio Files Directory",
	})
	if err != nil {
		return nil, err
	}

	if selection == "" {
		return nil, nil
	}

	// List audio files in the directory
	audioFiles := make([]AudioFile, 0)
	entries, err := os.ReadDir(selection)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if ext == ".mp3" || ext == ".wav" {
			audioFiles = append(audioFiles, AudioFile{
				Name: entry.Name(),
				Path: filepath.Join(selection, entry.Name()),
			})
		}
	}

	return &DirectorySelection{
		Path:       selection,
		AudioFiles: audioFiles,
	}, nil
}

// RefreshAudioFiles refreshes the list of audio files in a given directory
func (pb *ProfileBuilder) RefreshAudioFiles(directory string) ([]AudioFile, error) {
	audioFiles := make([]AudioFile, 0)

	if directory == "" {
		return audioFiles, nil
	}

	entries, err := os.ReadDir(directory)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if ext == ".mp3" || ext == ".wav" {
			audioFiles = append(audioFiles, AudioFile{
				Name: entry.Name(),
				Path: filepath.Join(directory, entry.Name()),
			})
		}
	}

	return audioFiles, nil
}

// BuildKeyboardProfile builds a keyboard profile from the provided data
func (pb *ProfileBuilder) BuildKeyboardProfile(request KeyboardBuildRequest) error {
	if request.Metadata.Name == "" {
		return fmt.Errorf("profile name is required")
	}

	// Collect all audio files that need to be copied
	audioFilesToCopy := make(map[string]bool)
	for _, source := range request.Sources {
		audioFilesToCopy[source.PressSound] = true
		if source.ReleaseSound != nil && *source.ReleaseSound != "" {
			audioFilesToCopy[*source.ReleaseSound] = true
		}
	}

	// Create a temporary directory
	tempDir, err := os.MkdirTemp("", "keyboard-profile-*")
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer func() {
		// Clean up temp directory if something fails
		if err != nil {
			os.RemoveAll(tempDir)
		}
	}()

	// Copy audio files
	for fileName := range audioFilesToCopy {
		srcPath := filepath.Join(request.Directory, fileName)
		dstPath := filepath.Join(tempDir, fileName)
		if err = copyFile(srcPath, dstPath); err != nil {
			return fmt.Errorf("failed to copy audio file %s: %w", fileName, err)
		}
	}

	// Build the profile YAML structure
	profileData := buildKeyboardProfileYAML(request)

	// Marshal to YAML
	yamlData, err := yaml.Marshal(profileData)
	if err != nil {
		return fmt.Errorf("failed to marshal profile to YAML: %w", err)
	}

	// Write profile.yaml
	profilePath := filepath.Join(tempDir, "profile.yaml")
	if err = os.WriteFile(profilePath, yamlData, 0644); err != nil {
		return fmt.Errorf("failed to write profile.yaml: %w", err)
	}

	// Generate UUID for the profile directory name
	profileUUID := uuid.New().String()

	// Get the profiles directory
	profilesDir := filepath.Join(mgr.GetRootDir(), "profiles")

	// Ensure profiles directory exists
	if err = os.MkdirAll(profilesDir, 0755); err != nil {
		return fmt.Errorf("failed to create profiles directory: %w", err)
	}

	// Move temp directory to profiles directory
	finalPath := filepath.Join(profilesDir, profileUUID)
	if err = os.Rename(tempDir, finalPath); err != nil {
		// If rename fails (cross-device), try copy and delete
		if err = copyDir(tempDir, finalPath); err != nil {
			return fmt.Errorf("failed to move profile to profiles directory: %w", err)
		}
		os.RemoveAll(tempDir)
	}

	// Reload profiles
	if err = profile.LoadProfiles(); err != nil {
		return fmt.Errorf("failed to reload profiles: %w", err)
	}

	return nil
}

// BuildMouseProfile builds a mouse profile from the provided data
func (pb *ProfileBuilder) BuildMouseProfile(request MouseBuildRequest) error {
	if request.Metadata.Name == "" {
		return fmt.Errorf("profile name is required")
	}

	// Collect all audio files that need to be copied
	audioFilesToCopy := make(map[string]bool)
	for _, source := range request.Sources {
		audioFilesToCopy[source.PressSound] = true
		if source.ReleaseSound != nil && *source.ReleaseSound != "" {
			audioFilesToCopy[*source.ReleaseSound] = true
		}
	}

	// Create a temporary directory
	tempDir, err := os.MkdirTemp("", "mouse-profile-*")
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer func() {
		// Clean up temp directory if something fails
		if err != nil {
			os.RemoveAll(tempDir)
		}
	}()

	// Copy audio files
	for fileName := range audioFilesToCopy {
		srcPath := filepath.Join(request.Directory, fileName)
		dstPath := filepath.Join(tempDir, fileName)
		if err = copyFile(srcPath, dstPath); err != nil {
			return fmt.Errorf("failed to copy audio file %s: %w", fileName, err)
		}
	}

	// Build the profile YAML structure
	profileData := buildMouseProfileYAML(request)

	// Marshal to YAML
	yamlData, err := yaml.Marshal(profileData)
	if err != nil {
		return fmt.Errorf("failed to marshal profile to YAML: %w", err)
	}

	// Write profile.yaml
	profilePath := filepath.Join(tempDir, "profile.yaml")
	if err = os.WriteFile(profilePath, yamlData, 0644); err != nil {
		return fmt.Errorf("failed to write profile.yaml: %w", err)
	}

	// Generate UUID for the profile directory name
	profileUUID := uuid.New().String()

	// Get the profiles directory
	profilesDir := filepath.Join(mgr.GetRootDir(), "profiles")

	// Ensure profiles directory exists
	if err = os.MkdirAll(profilesDir, 0755); err != nil {
		return fmt.Errorf("failed to create profiles directory: %w", err)
	}

	// Move temp directory to profiles directory
	finalPath := filepath.Join(profilesDir, profileUUID)
	if err = os.Rename(tempDir, finalPath); err != nil {
		// If rename fails (cross-device), try copy and delete
		if err = copyDir(tempDir, finalPath); err != nil {
			return fmt.Errorf("failed to move profile to profiles directory: %w", err)
		}
		os.RemoveAll(tempDir)
	}

	// Reload profiles
	if err = profile.LoadProfiles(); err != nil {
		return fmt.Errorf("failed to reload profiles: %w", err)
	}

	return nil
}

// buildKeyboardProfileYAML creates the YAML structure for a keyboard profile
func buildKeyboardProfileYAML(request KeyboardBuildRequest) map[string]any {
	// Build sources
	sources := make([]map[string]any, 0, len(request.Sources))
	defaultSources := make([]string, 0)

	for _, src := range request.Sources {
		sourceConfig := map[string]any{
			"press": src.PressSound,
		}
		if src.ReleaseSound != nil && *src.ReleaseSound != "" {
			sourceConfig["release"] = *src.ReleaseSound
		}

		sources = append(sources, map[string]any{
			"id":     src.Name,
			"source": sourceConfig,
		})

		if src.IsDefault {
			defaultSources = append(defaultSources, src.Name)
		}
	}

	// Build key assignments (other section)
	// Group keys by their assigned sources
	sourceToKeys := make(map[string][]string)
	for keyID, assignedSources := range request.KeyAssignments {
		if len(assignedSources) == 0 {
			continue
		}
		// Create a key for the source combination
		sourceKey := strings.Join(assignedSources, "|")
		sourceToKeys[sourceKey] = append(sourceToKeys[sourceKey], keyID)
	}

	other := make([]map[string]any, 0)
	for sourceKey, keys := range sourceToKeys {
		sourcesForKey := strings.Split(sourceKey, "|")
		keyEntry := map[string]any{
			"keys": keys,
		}
		if len(sourcesForKey) == 1 {
			keyEntry["sound"] = sourcesForKey[0]
		} else {
			keyEntry["sound"] = sourcesForKey
		}
		other = append(other, keyEntry)
	}

	return map[string]any{
		"profile": map[string]any{
			"name":        request.Metadata.Name,
			"author":      request.Metadata.Author,
			"description": request.Metadata.Description,
			"device":      "keyboard",
		},
		"sources": sources,
		"keys": map[string]any{
			"default": defaultSources,
			"other":   other,
		},
	}
}

// buildMouseProfileYAML creates the YAML structure for a mouse profile
func buildMouseProfileYAML(request MouseBuildRequest) map[string]any {
	// Build sources
	sources := make([]map[string]any, 0, len(request.Sources))
	var defaultSource string

	for _, src := range request.Sources {
		sourceConfig := map[string]any{
			"press": src.PressSound,
		}
		if src.ReleaseSound != nil && *src.ReleaseSound != "" {
			sourceConfig["release"] = *src.ReleaseSound
		}

		sources = append(sources, map[string]any{
			"id":     src.Name,
			"source": sourceConfig,
		})

		if src.IsDefault {
			defaultSource = src.Name
		}
	}

	// Check if there's a default assignment in mouseAssignments
	if defaultAssignment, ok := request.MouseAssignments["default"]; ok && defaultAssignment != "" {
		defaultSource = defaultAssignment
	}

	// Build button assignments (other section)
	other := make([]map[string]any, 0)
	for button, sourceName := range request.MouseAssignments {
		if button == "default" || sourceName == "" {
			continue
		}
		other = append(other, map[string]any{
			"buttons": []string{button},
			"sound":   sourceName,
		})
	}

	return map[string]any{
		"profile": map[string]any{
			"name":        request.Metadata.Name,
			"author":      request.Metadata.Author,
			"description": request.Metadata.Description,
			"device":      "mouse",
		},
		"sources": sources,
		"buttons": map[string]any{
			"default": defaultSource,
			"other":   other,
		},
	}
}

// copyFile copies a file from src to dst
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}

// copyDir copies a directory from src to dst
func copyDir(src, dst string) error {
	if err := os.MkdirAll(dst, 0755); err != nil {
		return err
	}

	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}

	return nil
}
