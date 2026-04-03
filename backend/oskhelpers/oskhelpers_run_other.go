//go:build !darwin

package oskhelpers

// RunMainLoop is a no-op on non-Darwin platforms. On macOS, use the RunMainLoop from oskhelpers_darwin.go.
func RunMainLoop() {}
