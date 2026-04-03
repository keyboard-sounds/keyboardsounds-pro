//go:build darwin

package app

import (
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/oskhelpers"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func registerOSKOverlayClickHandler() {
	oskhelpers.RegisterOverlayClickHandler(func() {
		if ctx == nil {
			return
		}
		runtime.WindowUnminimise(ctx)
		runtime.WindowShow(ctx)
	})
}
