package main

import (
	"fmt"

	"github.com/keyboard-sounds/keyboardsounds-pro/pkg/rules"
)

func main() {
	rules.LoadRules("C:\\Users\\natef\\keyboardsounds")

	rules, err := rules.ListRules()
	if err != nil {
		panic(fmt.Sprintf("failed to list rules: %v", err))
	}

	fmt.Println(rules)
}
