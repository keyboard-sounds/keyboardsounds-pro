package main

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
)

func main() {
	detector := rules.NewFocusDetector()
	if detector == nil {
		panic("detector not implemented for this platform")
	}

	err := detector.Listen(context.Background())
	if err != nil {
		panic(fmt.Sprintf("failed to start detector: %v", err))
	}

	slog.Info("detector started")

	events := detector.Events()
	for event := range events {
		fmt.Printf("event: %+v\n", event)
	}

	select {}
}
