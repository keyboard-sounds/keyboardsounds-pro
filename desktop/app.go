package main

import (
	"context"
	"desktop/app"
	"log/slog"
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

func (a *App) GetAnalyticsID() string {
	return app.GetAnalyticsID()
}

func (a *App) GetAnalyticsLastPingTimeMS() int64 {
	return app.GetAnalyticsLastPingTimeMS()
}

func (a *App) UpdateAnalyticsLastPingTime() error {
	return app.UpdateAnalyticsLastPingTime()
}
