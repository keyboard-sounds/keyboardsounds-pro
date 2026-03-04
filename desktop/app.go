package main

import (
	"context"
	"desktop/app"
	"log/slog"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize the app.
	err := app.Init(a.ctx)
	if err != nil {
		panic(err)
	}

	if updateDetails != nil {
		go func() {
			updateDetails.CheckForUpdateAndNotify()

			for {
				select {
				case <-time.After(24 * time.Hour):
					slog.Info("checking for update")
					updateDetails.CheckForUpdateAndNotify()
				case <-wailsCtx.Done():
					return
				}
			}
		}()
	}
}

func (a *App) SetStartWithSystem(startWithSystem bool) error {
	enabled := app.GetAutoStartApp().IsEnabled()

	switch {
	case startWithSystem && !enabled:
		return app.GetAutoStartApp().Enable()
	case !startWithSystem && enabled:
		return app.GetAutoStartApp().Disable()
	default:
		return nil
	}
}

func (a *App) GetStartWithSystem() bool {
	return app.GetAutoStartApp().IsEnabled()
}

// ShouldShowInputGroupWarning returns true on Linux when the current user is not
// in the input group. The frontend calls this on load and shows an in-app modal
// if true. Using a method call instead of an event avoids a race where the event
// is emitted before the frontend has registered its listener.
func (a *App) ShouldShowInputGroupWarning() bool {
	inInputGroup, err := IsUserInInputGroup()
	return err == nil && !inInputGroup
}

func (a *App) GetAnalyticsID() string {
	return app.GetAnalyticsID()
}

func (a *App) GetAnalyticsLastPingTimeMS() int64 {
	return app.GetAnalyticsLastPingTimeMS()
}

func (a *App) UpdateAnalyticsLastPingTime() error {
	return app.UpdateAnalyticsLastPingTime()
}

// CloseApplication exits the app completely. Used when changing settings that
// require a restart (e.g., custom title bar toggle). The user must start the
// app again manually.
func (a *App) CloseApplication() {
	os.Exit(0)
}

// IsUserInInputGroup runs the `groups` shell command and returns true if the
// current user is a member of the `input` group. The Linux input subsystem
// requires this for the app to capture keyboard input.
func IsUserInInputGroup() (bool, error) {
	if runtime.GOOS != "linux" {
		return true, nil
	}

	cmd := exec.Command("groups")
	output, err := cmd.Output()
	if err != nil {
		return false, err
	}

	groups := strings.Fields(string(output))
	for _, g := range groups {
		if g == "input" {
			return true, nil
		}
	}

	return false, nil
}
