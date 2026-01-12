package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"

	"desktop/app"

	"fyne.io/systray"
	"github.com/gen2brain/beeep"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed wails.json
var wailsJson []byte

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/windows/icon.ico
var sysTrayIcon []byte

//go:embed frontend/src/assets/images/app-icon.png
var notifIcon []byte

var (
	wailsCtx context.Context
	ctxMutex sync.RWMutex
)

func setWailsContext(ctx context.Context) {
	ctxMutex.Lock()
	defer ctxMutex.Unlock()
	wailsCtx = ctx
}

func getWailsContext() context.Context {
	ctxMutex.RLock()
	defer ctxMutex.RUnlock()
	return wailsCtx
}

type wailsConfig struct {
	Info struct {
		ProductVersion string `json:"productVersion"`
	} `json:"info"`
}

func (w *wailsConfig) GetVersion() string {
	return w.Info.ProductVersion
}

func NewWailsConfig() *wailsConfig {
	var config wailsConfig
	err := json.Unmarshal(wailsJson, &config)
	if err != nil {
		return &wailsConfig{
			Info: struct {
				ProductVersion string `json:"productVersion"`
			}{
				ProductVersion: "unknown",
			},
		}
	}

	return &config
}

var latestReleaseURL = "https://api.github.com/repos/keyboard-sounds/keyboardsounds-pro/releases/latest"

type UpdateDetails struct {
	CurrentVersion  string `json:"-"`
	LatestVersion   string `json:"tag_name"`
	DownloadURL     string `json:"html_url"`
	UpdateAvailable bool   `json:"-"`
}

func (u *UpdateDetails) GetLatestVersion() string {
	return u.LatestVersion
}

func (u *UpdateDetails) GetDownloadURL() string {
	return u.DownloadURL
}

func (u *UpdateDetails) IsUpdateAvailable() bool {
	return u.UpdateAvailable
}

func (u *UpdateDetails) CheckForUpdate() error {
	response, err := http.Get(latestReleaseURL)
	if err != nil {
		return err
	}

	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return err
	}

	err = json.Unmarshal(body, u)
	if err != nil {
		return err
	}

	u.LatestVersion = strings.TrimPrefix(strings.TrimPrefix(u.LatestVersion, "desktop/v"), "v")
	u.UpdateAvailable = u.LatestVersion != u.CurrentVersion && u.LatestVersion != ""

	return nil
}

func (u *UpdateDetails) CheckForUpdateAndNotify() {
	err := u.CheckForUpdate()
	if err != nil {
		slog.Error("failed to check for update", "error", err)
		return
	}

	if u.IsUpdateAvailable() && app.GetNotifyOnUpdate() {
		updateNotifiedAndIgnored := app.GetUpdateNotifiedAndIgnored()
		if updateNotifiedAndIgnored == u.LatestVersion {
			return
		}

		selectedButton, err := runtime.MessageDialog(wailsCtx, runtime.MessageDialogOptions{
			Type:          runtime.QuestionDialog,
			Title:         "Keyboard Sounds Pro - Update Available",
			Message:       fmt.Sprintf("Version %v of Keyboard Sounds Pro is now available! Would you like to download it now?", u.LatestVersion),
			DefaultButton: "No",
			Buttons:       []string{"Yes", "No"},
			Icon:          sysTrayIcon,
		})
		if err != nil {
			slog.Error("failed to show dialog", "error", err)
			return
		}

		switch selectedButton {
		case "Yes":
			runtime.BrowserOpenURL(wailsCtx, u.DownloadURL)
		case "No":
			app.SetUpdateNotifiedAndIgnored(u.LatestVersion)
			return
		}
	}
}

func NewUpdateDetails(currentVersion string) (*UpdateDetails, error) {
	response, err := http.Get(latestReleaseURL)
	if err != nil {
		return &UpdateDetails{}, err
	}

	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return &UpdateDetails{}, err
	}

	var updateDetails UpdateDetails

	err = json.Unmarshal(body, &updateDetails)
	if err != nil {
		return &UpdateDetails{}, err
	}

	updateDetails.LatestVersion = strings.TrimPrefix(strings.TrimPrefix(updateDetails.LatestVersion, "desktop/v"), "v")
	updateDetails.UpdateAvailable = updateDetails.LatestVersion != currentVersion && updateDetails.LatestVersion != ""
	updateDetails.CurrentVersion = currentVersion

	return &updateDetails, nil
}

var (
	updateDetails *UpdateDetails
)

func main() {
	// Create an instance of the app structure
	application := NewApp()

	// Create the status panel binding
	statusPanel := app.NewStatusPanel()

	// Create the app rules binding
	appRules := app.NewAppRules()

	// Create the audio effects binding
	audioEffects := app.NewAudioEffects()

	// Create the library binding
	library := app.NewLibrary()

	// Create the profile builder binding
	profileBuilder := app.NewProfileBuilder()

	// Create the community binding
	community := app.NewCommunityBinding()

	// Create the hotkeys binding
	hotkeys := app.NewHotKeys()

	wailsCfg := NewWailsConfig()

	ud, err := NewUpdateDetails(wailsCfg.Info.ProductVersion)
	if err != nil {
		slog.Error("failed to get update details", "error", err)
	}
	updateDetails = ud

	// Initialize systray
	onReady, onExit := systray.RunWithExternalLoop(func() {
		systray.SetIcon(sysTrayIcon)
		systray.SetTitle("Keyboard Sounds Pro")
		systray.SetTooltip("Keyboard Sounds Pro")
		systray.SetOnTapped(func() {
			ctx := getWailsContext()
			if ctx != nil {
				runtime.WindowShow(ctx)
			}
		})

		// Add Show menu item (handles icon click via menu)
		mShow := systray.AddMenuItem("Show", "Show the main window")
		go func() {
			for {
				<-mShow.ClickedCh
				ctx := getWailsContext()
				if ctx != nil {
					runtime.WindowShow(ctx)
				}
			}
		}()

		// Add Quit menu item
		mQuit := systray.AddMenuItem("Quit", "Quit the application")
		go func() {
			<-mQuit.ClickedCh
			systray.Quit()
			os.Exit(0)
		}()
	}, func() {
		// Cleanup on exit
	})

	// Start systray
	go onReady()

	// Get StartHidden preference
	startHidden := app.GetStartHidden()

	// Create application with options
	err = wails.Run(&options.App{
		Title:       "Keyboard Sounds Pro",
		Width:       1250,
		Height:      768,
		Frameless:   true,
		StartHidden: startHidden,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		OnStartup: func(ctx context.Context) {
			setWailsContext(ctx)
			application.startup(ctx)
		},
		OnBeforeClose: func(ctx context.Context) (prevent bool) {
			// Hide the window instead of closing
			runtime.WindowHide(ctx)
			// Only show notification if the preference is enabled
			if app.GetNotifyOnMinimize() {
				beeep.AppName = "Keyboard Sounds Pro"
				beeep.Notify("Keyboard Sounds Pro", "Keyboard Sounds Pro is running in the background", notifIcon)
			}
			return true // Prevent default close behavior
		},
		Bind: []interface{}{
			application,
			statusPanel,
			appRules,
			audioEffects,
			library,
			profileBuilder,
			community,
			hotkeys,
			wailsCfg,
			updateDetails,
		},
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId:               "keyboard-sounds-pro",
			OnSecondInstanceLaunch: app.OnSecondInstanceLaunched,
		},
	})

	if startHidden && app.GetNotifyOnMinimize() {
		beeep.AppName = "Keyboard Sounds Pro"
		beeep.Notify("Keyboard Sounds Pro", "Keyboard Sounds Pro is running in the background", notifIcon)
	}

	// Cleanup systray on exit
	onExit()

	if err != nil {
		println("Error:", err.Error())
	}
}
