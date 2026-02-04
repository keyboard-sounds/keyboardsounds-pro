package app

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/emersion/go-autostart"
	"github.com/otiai10/copy"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/manager"
)

var (
	mgr          *manager.Manager
	ctx          context.Context
	kbsDir       string
	autoStartApp *autostart.App
)

func Init(c context.Context) error {
	ctx = c

	kbsDir = kbs.GetHomeDirectory()

	var err error

	// Only seed profiles if not in dev mode.
	if runtime.Environment(ctx).BuildType != "dev" {
		err = seedProfiles()
		if err != nil {
			panic(err)
		}
	} else {
		slog.Info("Dev mode, skipping profile seeding")
	}

	mgr, err = manager.NewManager(kbsDir)
	if err != nil {
		panic(err)
	}

	// Register hotkey delegate to emit events when hotkeys are triggered
	RegisterHotKeyEventDelegate()

	// Apply saved audio effects preferences
	ApplyAudioEffectsFromPreferences()
	// Apply saved volume preferences
	ApplyVolumeFromPreferences()
	// Apply saved OSK Helper preferences
	ApplyOSKHelperFromPreferences()
	// Enable manager if start playing on launch is set
	if GetStartPlayingOnLaunch() {
		// Get the status panel to enable the manager
		statusPanel := NewStatusPanel()
		statusPanel.Enable()
	}

	exePath, err := os.Executable()
	if err != nil {
		panic(err)
	}

	appPath, err := filepath.EvalSymlinks(exePath)
	if err != nil {
		panic(err)
	}

	autoStartApp = &autostart.App{
		Name:        "Keyboard Sounds Pro",
		DisplayName: "Keyboard Sounds Pro",
		Exec:        []string{appPath},
	}

	return nil
}

func GetAutoStartApp() *autostart.App {
	return autoStartApp
}

func OnSecondInstanceLaunched(data options.SecondInstanceData) {
	runtime.WindowUnminimise(ctx)
	runtime.WindowShow(ctx)
}

func seedProfiles() error {
	exePath, err := os.Executable()
	if err != nil {
		panic(err)
	}

	installDir := filepath.Dir(exePath)

	bundledProfilesDir := filepath.Join(installDir, "bundled-profiles")
	kbsProfilesDir := filepath.Join(kbsDir, "profiles")

	slog.Info("Seeding profiles", "bundledProfilesDir", bundledProfilesDir, "kbsProfilesDir", kbsProfilesDir)

	// Ensure bundled profiles dir exists
	if _, err := os.Stat(bundledProfilesDir); os.IsNotExist(err) {
		return fmt.Errorf("bundled profiles dir does not exist")
	}

	// Check if kbs profiles dir exists, and if not, create it
	if _, err := os.Stat(kbsProfilesDir); os.IsNotExist(err) {
		// Create kbs profiles dir
		err = os.MkdirAll(kbsProfilesDir, 0755)
		if err != nil {
			return fmt.Errorf("failed to create kbs profiles dir: %w", err)
		}

		// Copy all contents of bundled profiles dir to kbs profiles dir
		err = copy.Copy(bundledProfilesDir, kbsProfilesDir)
		if err != nil {
			return fmt.Errorf("failed to copy bundled profiles to kbs profiles dir: %w", err)
		}

		return nil
	}

	// Keep kbs profiles directory in sync with bundled profiles directory. This way if new profiles are added
	// to the bundled profiles directory with a new release, the profiles will be available in the kbs profiles directory.
	bundled, err := os.ReadDir(bundledProfilesDir)
	if err != nil {
		return fmt.Errorf("failed to read bundled profiles dir: %w", err)
	}

	for _, profile := range bundled {
		if profile.IsDir() {
			id := profile.Name()
			profilePath := filepath.Join(kbsProfilesDir, id)
			if _, err := os.Stat(profilePath); os.IsNotExist(err) {
				err = copy.Copy(filepath.Join(bundledProfilesDir, id), profilePath)
				if err != nil {
					return fmt.Errorf("failed to copy bundled profile %s to kbs profiles dir: %w", id, err)
				}
			}
		}
	}

	return nil
}
