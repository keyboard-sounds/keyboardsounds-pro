package app

import (
	"context"
	"time"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/oskhelpers"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// OSKHelperBinding provides frontend bindings for OSK Helper configuration
type OSKHelperBinding struct {
	ctx context.Context
}

// NewOSKHelperBinding creates a new OSK Helper binding
func NewOSKHelperBinding() *OSKHelperBinding {
	return &OSKHelperBinding{}
}

// EmitOSKHelperStateChanged emits an event to the frontend when OSK Helper state changes
// and saves the state to preferences
func EmitOSKHelperStateChanged() {
	// Save to preferences
	SaveOSKHelperToPreferences()
	
	// Emit event to frontend
	if ctx != nil {
		runtime.EventsEmit(ctx, "osk-helper-state-changed")
	}
}

// OSKHelperState represents the state of the OSK Helper
type OSKHelperState struct {
	Enabled           bool   `json:"enabled"`
	FontSize          int    `json:"fontSize"`
	FontColor         string `json:"fontColor"`
	BackgroundColor   string `json:"backgroundColor"`
	BackgroundOpacity int    `json:"backgroundOpacity"`
	CornerRadius      int    `json:"cornerRadius"`
	Position          string `json:"position"`
	Offset            int    `json:"offset"`
	DismissAfter      int64  `json:"dismissAfter"` // milliseconds
	MonitorIndex      int    `json:"monitorIndex"`
	ClickOverlayShowsApp bool `json:"clickOverlayShowsApp"`
}

// GetState returns the current OSK Helper configuration
func (b *OSKHelperBinding) GetState() OSKHelperState {
	enabled := kbsApp.GetOSKHelperEnabled()
	config := kbsApp.GetOSKHelperConfig()
	clickShows := false
	uiPrefsLock.RLock()
	if uiPrefs != nil {
		clickShows = uiPrefs.OSKHelper.ClickOverlayShowsApp
	}
	uiPrefsLock.RUnlock()

	return OSKHelperState{
		Enabled:              enabled,
		FontSize:             config.FontSize,
		FontColor:            config.FontColor,
		BackgroundColor:      config.BackgroundColor,
		BackgroundOpacity:    config.BackgroundOpacity,
		CornerRadius:         config.CornerRadius,
		Position:             string(config.Position),
		Offset:               config.Offset,
		DismissAfter:         config.DismissAfter.Milliseconds(),
		MonitorIndex:         config.MonitorIndex,
		ClickOverlayShowsApp: clickShows,
	}
}

// GetClickOverlayShowsApp returns whether clicking the OSK overlay shows the main window (macOS).
func (b *OSKHelperBinding) GetClickOverlayShowsApp() bool {
	uiPrefsLock.RLock()
	defer uiPrefsLock.RUnlock()
	if uiPrefs == nil {
		return true
	}
	return uiPrefs.OSKHelper.ClickOverlayShowsApp
}

// SetClickOverlayShowsApp persists the preference and applies it to the native overlay (macOS).
func (b *OSKHelperBinding) SetClickOverlayShowsApp(enabled bool) {
	uiPrefsLock.Lock()
	if uiPrefs != nil {
		uiPrefs.OSKHelper.ClickOverlayShowsApp = enabled
	}
	uiPrefsLock.Unlock()
	oskhelpers.SetClickOverlayShowsApp(enabled)
	_ = saveUIPreferences()
}

// SetEnabled enables or disables the OSK Helper
func (b *OSKHelperBinding) SetEnabled(enabled bool) {
	kbsApp.SetOSKHelperEnabled(enabled)
	SaveOSKHelperToPreferences()
}

// SetConfig updates the OSK Helper configuration
func (b *OSKHelperBinding) SetConfig(fontSize int, fontColor string, backgroundColor string, backgroundOpacity int, cornerRadius int, position string, offset int, dismissAfter int64, monitorIndex int) {
	config := oskhelpers.OSKHelperConfig{
		FontSize:          fontSize,
		FontColor:         fontColor,
		BackgroundColor:   backgroundColor,
		BackgroundOpacity: backgroundOpacity,
		CornerRadius:      cornerRadius,
		Position:          oskhelpers.OSKPosition(position),
		Offset:            offset,
		DismissAfter:      time.Duration(dismissAfter) * time.Millisecond,
		MonitorIndex:      monitorIndex,
	}

	kbsApp.SetOSKHelperConfig(config)
	SaveOSKHelperToPreferences()
}

// GetMonitors returns information about all available monitors
func (b *OSKHelperBinding) GetMonitors() []oskhelpers.MonitorInfo {
	return oskhelpers.GetMonitors()
}
