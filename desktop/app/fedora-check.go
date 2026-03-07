package app

import (
	"bufio"
	"log/slog"
	"os"
	"runtime"
	"strings"
)

type FedoraCheck struct{}

func NewFedoraCheck() *FedoraCheck {
	return &FedoraCheck{}
}

func getOSRelease() (map[string]string, error) {
	file, err := os.Open("/etc/os-release")
	if err != nil {
		return nil, err
	}
	defer file.Close()

	values := map[string]string{}

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()

		if strings.TrimSpace(line) == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := parts[0]
		val := strings.Trim(parts[1], `"`)

		values[key] = val
	}

	return values, scanner.Err()
}

func (f *FedoraCheck) IsFedora() bool {
	if runtime.GOOS != "linux" {
		return false
	}

	info, err := getOSRelease()
	if err != nil {
		slog.Info("failed to check if running fedora", "error", err)
		return false
	}

	if id, ok := info["ID"]; ok {
		return id == "fedora"
	}

	return false
}
