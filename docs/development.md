# Development

Keyboard Sounds Pro can easily be built from source for any platform.

## Prerequisites

- [Go Programming Language](https://go.dev/doc/install)
- [NodeJS](https://nodejs.org/en/download/)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation/)

## Running the Desktop App locally

For more information on application development see the [official wails development documentation](https://wails.io/docs/gettingstarted/development).

```sh
cd desktop
wails dev
```

## Compiling the Desktop Application

For more information on application development see the [official wails build documentation](https://wails.io/docs/gettingstarted/building).

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

## Configuring the desktop app to use the local backend

By default, the desktop application will rely on the latest deployed version of the Keyboard Sounds Backend. To use the local version of the Keyboard Sounds Backend, add the `replace` directive to the bottom of `./desktop/go.mod`.

```
replace github.com/keyboard-sounds/keyboardsounds-pro/backend => ../backend
```

> This is only required if you intend to make changes to the backend and want those changes included in a build of the desktop application.

## Use the Keyboard Sounds Backend

Keyboard Sounds Pro uses the Keyboard Sounds backend to manage profiles, audio, keyboard and mouse events, and application rules. This backend is made entirely public and is free to use to develop your own applications.

For detailed documentation, see the [API documentation](https://pkg.go.dev/github.com/keyboard-sounds/keyboardsounds-pro/backend) and [examples](https://github.com/keyboard-sounds/keyboardsounds-pro/tree/main/backend/internal/cmd/example).

```sh
$ go get github.com/keyboard-sounds/keyboardsounds-pro/backend
```

```go
package main

import (
	"os"
	"log"

	kbs "github.com/keyboard-sounds/keyboardsounds-pro/backend"
	"github.com/keyboard-sounds/keyboardsounds-pro/backend/manager"
)

func main() {
	mgr, err := manager.NewManager(kbs.GetHomeDirectory())
	if err != nil{
		log.Fatalf("Failed to create manager: %v", err)
	}

	err = mgr.Enable()
	if err != nil{
		log.Fatalf("Failed to enable manager: %v", err)
	}

	// Wait indefinitely.
	select {}
}
```
