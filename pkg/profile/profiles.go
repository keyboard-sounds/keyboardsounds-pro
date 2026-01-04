package profile

import (
	"archive/zip"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/samber/lo"
	"gopkg.in/yaml.v2"
)

var (
	profilesDir  *string    = nil
	profiles     []*Profile = make([]*Profile, 0)
	profilesLock sync.RWMutex
)

// SetProfilesDir sets the directory where profiles are stored.
func SetProfilesDir(dir string) {
	profilesLock.Lock()
	defer profilesLock.Unlock()

	if profilesDir != nil {
		if *profilesDir == dir {
			return
		}
	}

	profiles = make([]*Profile, 0)
	profilesDir = &dir
}

// LoadProfiles loads all profiles from the current profiles directory.
func LoadProfiles() error {
	profilesLock.Lock()
	defer profilesLock.Unlock()

	if profilesDir == nil {
		return fmt.Errorf("profiles directory not set")
	}

	// Clear the profiles slice
	profiles = make([]*Profile, 0)

	entries, err := os.ReadDir(*profilesDir)
	if err != nil {
		return fmt.Errorf("failed to read profiles directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			profilePath := filepath.Join(*profilesDir, entry.Name())

			// Ensure that profile.yaml exists
			profileMetadataFile := filepath.Join(*profilesDir, entry.Name(), "profile.yaml")
			if _, err := os.Stat(profileMetadataFile); os.IsNotExist(err) {
				slog.Error("Profile metadata file not found", "path", profilePath)
				continue
			}

			// Load the profile metadata
			profileMetadata, err := os.ReadFile(profileMetadataFile)
			if err != nil {
				slog.Error("Failed to read profile metadata file", "path", profileMetadataFile, "error", err)
				continue
			}

			var profile Profile
			err = yaml.Unmarshal(profileMetadata, &profile)
			if err != nil {
				slog.Error("Failed to unmarshal profile metadata", "path", profileMetadataFile, "error", err)
				continue
			}
			profile.Location = profilePath

			// Default to keyboard if device type is not set
			if profile.Details.DeviceType != DeviceTypeMouse {
				profile.Details.DeviceType = DeviceTypeKeyboard
			}

			profiles = append(profiles, &profile)
		}
	}

	return nil
}

// GetKeyboardProfiles returns a list of all keyboard profiles.
func GetKeyboardProfiles() []*Profile {
	return lo.Filter(profiles, func(profile *Profile, _ int) bool {
		return profile.Details.DeviceType == DeviceTypeKeyboard
	})
}

// GetMouseProfiles returns a list of all mouse profiles.
func GetMouseProfiles() []*Profile {
	return lo.Filter(profiles, func(profile *Profile, _ int) bool {
		return profile.Details.DeviceType == DeviceTypeMouse
	})
}

// FindProfileByName finds a profile by name.
func FindProfileByName(name string) (*Profile, bool) {
	profilesLock.RLock()
	defer profilesLock.RUnlock()

	return lo.Find(profiles, func(profile *Profile) bool {
		return strings.EqualFold(profile.Details.Name, name)
	})
}

// DeleteProfile deletes a profile by name.
func DeleteProfile(name string) error {
	profile, found := FindProfileByName(name)
	if !found {
		return fmt.Errorf("profile not found")
	}

	profilesLock.Lock()
	defer profilesLock.Unlock()

	err := os.RemoveAll(profile.Location)
	if err != nil {
		return fmt.Errorf("failed to delete profile: %w", err)
	}

	profiles = lo.Filter(profiles, func(p *Profile, _ int) bool {
		return !strings.EqualFold(p.Details.Name, name)
	})

	return nil
}

// ExportProfile exports a profile to a zip file.
func ExportProfile(name string, zipPath string) error {
	profile, found := FindProfileByName(name)
	if !found {
		return fmt.Errorf("profile not found")
	}

	// Determine the zip file path
	var zipFilePath string
	if strings.HasSuffix(zipPath, ".zip") {
		zipFilePath = zipPath
	} else {
		// If zipPath is a directory, create zip file with profile name
		zipFileName := profile.Details.Name + ".zip"
		zipFilePath = filepath.Join(zipPath, zipFileName)
	}

	// Create the zip file
	zipFile, err := os.Create(zipFilePath)
	if err != nil {
		return fmt.Errorf("failed to create zip file: %w", err)
	}
	defer zipFile.Close()

	// Create a zip writer
	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	// Walk through the profile directory and add files to zip
	err = filepath.Walk(profile.Location, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip the directory itself
		if info.IsDir() {
			return nil
		}

		// Calculate relative path from profile location
		relPath, err := filepath.Rel(profile.Location, filePath)
		if err != nil {
			return fmt.Errorf("failed to get relative path: %w", err)
		}

		// Create a file header
		fileHeader, err := zip.FileInfoHeader(info)
		if err != nil {
			return fmt.Errorf("failed to create file header: %w", err)
		}
		fileHeader.Name = relPath
		fileHeader.Method = zip.Deflate

		// Create the file in the zip
		writer, err := zipWriter.CreateHeader(fileHeader)
		if err != nil {
			return fmt.Errorf("failed to create file in zip: %w", err)
		}

		// Open and copy the file content
		file, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("failed to open file: %w", err)
		}
		defer file.Close()

		_, err = io.Copy(writer, file)
		if err != nil {
			return fmt.Errorf("failed to copy file content: %w", err)
		}

		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to zip profile: %w", err)
	}

	return nil
}

// ImportProfile imports a profile from a zip file.
func ImportProfile(zipPath string) error {
	if profilesDir == nil {
		return fmt.Errorf("profiles directory not set")
	}

	// Open the zip file
	zipReader, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("failed to open zip file: %w", err)
	}
	defer zipReader.Close()

	// Create a temporary directory for extraction
	tempDir, err := os.MkdirTemp("", "profile-import-*")
	if err != nil {
		return fmt.Errorf("failed to create temporary directory: %w", err)
	}
	shouldCleanup := true
	defer func() {
		// Clean up temp directory if we need to
		if shouldCleanup && tempDir != "" {
			os.RemoveAll(tempDir)
		}
	}()

	// Extract all files from the zip to temporary directory
	for _, file := range zipReader.File {
		// Construct the file path
		filePath := filepath.Join(tempDir, file.Name)

		// Check for ZipSlip vulnerability by ensuring the resolved path is within the target directory
		absTargetDir, err := filepath.Abs(tempDir)
		if err != nil {
			return fmt.Errorf("failed to get absolute path of target directory: %w", err)
		}
		absFilePath, err := filepath.Abs(filePath)
		if err != nil {
			return fmt.Errorf("failed to get absolute path of file: %w", err)
		}
		relPath, err := filepath.Rel(absTargetDir, absFilePath)
		if err != nil || strings.HasPrefix(relPath, "..") {
			return fmt.Errorf("invalid file path: %s", file.Name)
		}

		// Create directory structure if needed
		if file.FileInfo().IsDir() {
			err = os.MkdirAll(filePath, file.FileInfo().Mode())
			if err != nil {
				return fmt.Errorf("failed to create directory: %w", err)
			}
			continue
		}

		// Ensure parent directory exists
		err = os.MkdirAll(filepath.Dir(filePath), 0755)
		if err != nil {
			return fmt.Errorf("failed to create parent directory: %w", err)
		}

		// Create the file
		outFile, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.FileInfo().Mode())
		if err != nil {
			return fmt.Errorf("failed to create file: %w", err)
		}

		// Open file from zip
		fileReader, err := file.Open()
		if err != nil {
			outFile.Close()
			return fmt.Errorf("failed to open file in zip: %w", err)
		}

		// Copy file content
		_, err = io.Copy(outFile, fileReader)
		outFile.Close()
		fileReader.Close()
		if err != nil {
			return fmt.Errorf("failed to extract file: %w", err)
		}
	}

	// Read profile.yaml to get the profile name
	profileYamlPath := filepath.Join(tempDir, "profile.yaml")
	profileMetadata, err := os.ReadFile(profileYamlPath)
	if err != nil {
		return fmt.Errorf("failed to read profile.yaml: %w", err)
	}

	var profile Profile
	err = yaml.Unmarshal(profileMetadata, &profile)
	if err != nil {
		return fmt.Errorf("failed to unmarshal profile metadata: %w", err)
	}

	// Check if a profile with the same name already exists
	_, exists := FindProfileByName(profile.Details.Name)
	if exists {
		return fmt.Errorf("profile with name '%s' already exists", profile.Details.Name)
	}

	// Generate UUID for the new profile directory
	profileUUID := uuid.New().String()
	newProfileDir := filepath.Join(*profilesDir, profileUUID)

	// Move the temporary directory to the final location
	err = os.Rename(tempDir, newProfileDir)
	if err != nil {
		return fmt.Errorf("failed to move profile to final location: %w", err)
	}

	// Mark that we don't need to clean up since we successfully moved the directory
	shouldCleanup = false

	// Reload profiles to include the newly imported one
	err = LoadProfiles()
	if err != nil {
		return fmt.Errorf("failed to reload profiles after import: %w", err)
	}

	return nil
}
