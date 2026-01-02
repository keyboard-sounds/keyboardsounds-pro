package main

import (
	"fmt"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/rules"
)

func main() {
	apps := rules.GetInstalledApplications()
	for _, app := range apps {
		fmt.Println(app.Name, app.ExecutablePath)
	}
}
