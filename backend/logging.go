package backend

import (
	"log/slog"
	"os"
	"path/filepath"
	"time"
)

var (
	LOG_RETENTION_PERIOD = (24 * time.Hour) * 3
)

// InitLogging initializes the logging system by setting up a log directory and file.
func InitLogging() {
	logDir := filepath.Join(GetHomeDirectory(), "logs")

	// Create log directory if it doesn't exist
	if err := os.MkdirAll(logDir, 0755); err != nil {
		panic(err)
	}

	// Delete any old log files
	now := time.Now()
	filepath.Walk(logDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		if now.Sub(info.ModTime()) > LOG_RETENTION_PERIOD {
			os.Remove(path)
		}
		return nil
	})

	// Set log file path
	logFile := filepath.Join(logDir, time.Now().Format("2006-01-02_15-04-05.log"))

	// Set up slog to write to this file
	f, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		panic(err)
	}
	slog.SetDefault(slog.New(slog.NewTextHandler(f, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})))
}
