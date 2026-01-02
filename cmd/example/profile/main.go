package main

import (
	_ "embed"
	"fmt"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/profile"
)

func main() {
	profile.SetProfilesDir("./cmd/example/profile")

	err := profile.LoadProfiles()
	if err != nil {
		panic(err)
	}

	profiles := profile.GetKeyboardProfiles()
	for _, profile := range profiles {
		fmt.Printf("%v\n", profile.Details.Name)
		fmt.Printf("  Author: %v\n", profile.Details.Author)
		fmt.Printf("  Description: %v\n", profile.Details.Description)
		fmt.Printf("  Location: %v\n", profile.Location)
		fmt.Printf("  Sources:\n")
		for _, source := range profile.Sources {
			fmt.Printf("    %v\n", source.ID)
			sourceConfig, err := source.GetSourceConfig()
			if err != nil {
				panic(err)
			}
			fmt.Printf("      Press: %v\n", sourceConfig.Press)
			fmt.Printf("      Release: %v\n", sourceConfig.Release)
		}
	}
}
