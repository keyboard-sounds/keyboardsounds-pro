package main

import (
	"context"
	"fmt"

	"github.com/keyboard-sounds/keyboardsounds-pro/backend/listener"
)

func main() {
	listener := listener.NewMouseListener()
	if listener == nil {
		panic("listener not implemented for this platform")
	}

	err := listener.Listen(context.Background())
	if err != nil {
		panic(fmt.Sprintf("failed to start listener: %v", err))
	}

	events := listener.Events()
	for event := range events {
		fmt.Printf("%v\n", event)
	}
}
