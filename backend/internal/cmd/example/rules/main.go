package main

import (
	"fmt"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/rules"
)

func main() {
	rules.LoadRules(kbs.GetHomeDirectory())

	rules, err := rules.ListRules()
	if err != nil {
		panic(fmt.Sprintf("failed to list rules: %v", err))
	}

	fmt.Println(rules)
}
