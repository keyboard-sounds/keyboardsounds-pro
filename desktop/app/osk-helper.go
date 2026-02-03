package app

import (
	"context"
	"time"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/oskhelpers"
)

// OSKHelperBinding provides frontend bindings for OSK Helper configuration
type OSKHelperBinding struct {
	ctx context.Context
}

// NewOSKHelperBinding creates a new OSK Helper binding
func NewOSKHelperBinding() *OSKHelperBinding {
	return &OSKHelperBinding{}
}

// startup is called when the app starts
func (b *OSKHelperBinding) startup(ctx context.Context) {
	b.ctx = ctx
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
}

// GetState returns the current OSK Helper configuration
func (b *OSKHelperBinding) GetState() OSKHelperState {
	enabled := mgr.GetOSKHelperEnabled()
	config := mgr.GetOSKHelperConfig()

	return OSKHelperState{
		Enabled:           enabled,
		FontSize:          config.FontSize,
		FontColor:         config.FontColor,
		BackgroundColor:   config.BackgroundColor,
		BackgroundOpacity: config.BackgroundOpacity,
		CornerRadius:      config.CornerRadius,
		Position:          string(config.Position),
		Offset:            config.Offset,
		DismissAfter:      config.DismissAfter.Milliseconds(),
		MonitorIndex:      config.MonitorIndex,
	}
}

// SetEnabled enables or disables the OSK Helper
func (b *OSKHelperBinding) SetEnabled(enabled bool) {
	mgr.SetOSKHelperEnabled(enabled)
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

	mgr.SetOSKHelperConfig(config)
	SaveOSKHelperToPreferences()
}

// GetMonitors returns information about all available monitors
func (b *OSKHelperBinding) GetMonitors() []oskhelpers.MonitorInfo {
	return oskhelpers.GetMonitors()
}
