# Development

Keyboard Sounds Pro can easily be built from source for any platform.

## Prerequisites

- [Go Programming Language](https://go.dev/doc/install)
- [NodeJS](https://nodejs.org/en/download/)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation/)

## Desktop Development

For information on developing the front end application (stored in `desktop`, please reference) [the official wails development documentation](https://wails.io/docs/gettingstarted/development).

```sh
cd desktop
wails dev
```

## Backend Development

[![Go Reference](https://pkg.go.dev/badge/github.com/keyboard-sounds/keyboardsounds-pro/backend.svg)](https://pkg.go.dev/github.com/keyboard-sounds/keyboardsounds-pro/backend)

### Configuring the desktop app to use the local backend

By default, the desktop application will rely on the latest deployed version of the Keyboard Sounds Backend. To use the local version of the Keyboard Sounds Backend, add the `replace` directive to the bottom of `./desktop/go.mod`.

```
replace github.com/keyboard-sounds/keyboardsounds-pro/backend => ../backend
```

For more backend information, check out the [Backend Docs](https://pkg.go.dev/github.com/keyboard-sounds/keyboardsounds-pro/backend).

```sh
cd backend
go doc
```

## Compiling the Desktop Application

For more information on building Wails applications see the [official wails build documentation](https://wails.io/docs/gettingstarted/building).

### Windows

```sh
cd desktop
wails build
```

Afert building the desktop application, the binary will be placed in `./desktop/build/bin`.

1. Move the application to `C:\Program Files\Keyboard Sounds Pro\`
2. Copy `./desktop/bundled-profiles` into the same directory.
3. Create a shortcut to the binary on your desktop to run the application.

### Linux

```sh
cd desktop
./build-deb.sh 0.0.0
# or ./build-rpm.sh
```

The installer will be placed in `./desktop/build/bin`.

### MacOS

```sh
cd desktop
wails build -platform darwin/universal -clean
cp -r ./bundled-profiles "./build/bin/Keyboard Sounds Pro.app/Contents/Resources/"
cp -r ./iconfile.icns "./build/bin/Keyboard Sounds Pro.app/Contents/Resources/"
```

Move the application in `./build/bin` to your `/Applications` directory to install the built application.

## Use the Keyboard Sounds Backend in your Own Project

Keyboard Sounds Pro uses the Keyboard Sounds backend to manage profiles, audio, keyboard and mouse events, and application rules. This backend is made entirely public and is free to use to develop your own applications.

For detailed documentation, see the [Backend Docs](https://pkg.go.dev/github.com/keyboard-sounds/keyboardsounds-pro/backend) and [examples usages](https://github.com/keyboard-sounds/keyboardsounds-pro/tree/main/backend/internal/cmd/example).

```sh
$ go get github.com/keyboard-sounds/keyboardsounds-pro/backend
```

```go
package main

import (
	"os"
	"log"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/app"
)

func main() {
	kbsApp, err := app.NewApp(kbs.GetHomeDirectory())
	if err != nil{
		log.Fatalf("Failed to create application: %v", err)
	}

	err = kbsApp.Enable()
	if err != nil{
		log.Fatalf("Failed to enable application: %v", err)
	}

	// Wait indefinitely.
	select {}
}
```
