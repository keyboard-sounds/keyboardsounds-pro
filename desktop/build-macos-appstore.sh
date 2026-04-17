#!/bin/bash

### This script is used to compile the macOS app for the App Store.
###
### If you are just trying to build the macOS application from source
### for personal use, you should not use this script.
###
### Instead, simply run the following from the `desktop` directory.
###
###   ```
###   wails build -platform darwin/uninversal
###   ```
###
### The output `.app` bundle will be placed in `build/bin`.

set -euox pipefail

# Prints absolute path to the main Mach-O executable inside a .app bundle; returns 1 if none.
find_main_macho_exe() {
  local app="$1"
  local macos="${app}/Contents/MacOS"
  local plist="${app}/Contents/Info.plist"

  [[ -d "$macos" ]] || return 1

  local name
  name="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$plist" 2>/dev/null | tr -d '\r\n' || true)"

  local f ftype hit=""
  if [[ -n "$name" && -f "${macos}/${name}" ]]; then
    echo "${macos}/${name}"
    return 0
  fi

  shopt -s nullglob
  for f in "$macos"/*; do
    [[ -f "$f" ]] || continue
    ftype=$(file -b "$f")
    [[ "$ftype" == *'Mach-O'* ]] || continue
    [[ "$ftype" == *'shared library'* ]] && continue
    hit="$f"
    break
  done
  shopt -u nullglob

  [[ -n "$hit" ]] || return 1
  echo "$hit"
  return 0
}

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

# Configure code signing certificates
APP_CERTIFICATE="3rd Party Mac Developer Application: Nathanial Fiscaletti (CW6RB36J5X)"
PKG_CERTIFICATE="3rd Party Mac Developer Installer: Nathanial Fiscaletti (CW6RB36J5X)"

# Ensure that the ./embedded.provisionprofile file exists
if [[ ! -f "./embedded.provisionprofile" ]]; then
  echo "error: ./embedded.provisionprofile not found" >&2
  exit 1
fi

command -v jq >/dev/null 2>&1 || {
    echo "error: jq is required but not installed" >&2
    exit 1
}

# Set `productVersion` in wails.json
VERSION="$1"
tmp=$(mktemp)
jq --arg version "$VERSION" '.info.productVersion = $version' wails.json > "$tmp" && mv "$tmp" wails.json

# Build the application.
wails build -platform darwin/universal -clean

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${SCRIPT_DIR}/build/bin"
APP="${SCRIPT_DIR}/build/bin/Keyboard Sounds Pro.app"

# Validate wails build

if [[ ! -d "$APP" ]]; then
  echo "error: application bundle not found: $APP" >&2
  exit 1
fi

if ! find_main_macho_exe "$APP" >/dev/null; then
  echo "error: this bundle has no macOS executable (Contents/MacOS is empty or has no Mach-O binary):" >&2
  echo "  $APP" >&2
  echo "A .dmg can only be made from a real macOS app produced by Wails on this Mac." >&2
  echo "Run:" >&2
  echo "  cd \"$SCRIPT_DIR\" && wails build" >&2
  echo "Then run $0 again." >&2
  exit 1
fi

# Remove self-signature
codesign --remove-signature "$APP"

# Set up bundle
cp -r ./bundled-profiles "$APP/Contents/Resources/"
xattr -dr com.apple.quarantine "$APP/Contents/Resources/bundled-profiles" || true
cp ./embedded.provisionprofile "$APP/Contents/"
xattr -d com.apple.quarantine "$APP/Contents/embedded.provisionprofile" || true
cp ./iconfile.icns "$APP/Contents/Resources/"
xattr -d com.apple.quarantine "$APP/Contents/Resources/iconfile.icns" || true

# Run Code Signing
codesign --timestamp --options=runtime -s "$APP_CERTIFICATE" -v --entitlements ./build/darwin/entitlements.plist "$APP"

# Build PKG
productbuild --sign "$PKG_CERTIFICATE" --component "$APP" /Applications "./build/bin/Keyboard Sounds Pro.pkg"

# Restore wails.json
VERSION="dev"
tmp=$(mktemp)
jq --arg version "$VERSION" '.info.productVersion = $version' wails.json > "$tmp" && mv "$tmp" wails.json
