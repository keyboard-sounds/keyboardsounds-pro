#!/bin/bash
# Set SKIP_DMG_CODESIGN=1 if the .app is already signed with a Developer ID certificate.

set -euo pipefail

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

wails build

VERSION="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="${SCRIPT_DIR}/build/bin/Keyboard Sounds Pro.app"
OUT="${SCRIPT_DIR}/build/bin/Keyboard-Sounds-Pro_${VERSION}_arm64.dmg"

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

STAGING="$(mktemp -d "${TMPDIR:-/tmp}/kspro-dmg.XXXXXX")"
trap 'rm -rf "$STAGING"' EXIT

STAGED_APP="${STAGING}/Keyboard Sounds Pro.app"
ditto "$APP" "$STAGED_APP"

ls "$STAGED_APP"
cp -r ./bundled-profiles "$STAGED_APP/Contents/MacOS/"

EXE="$(find_main_macho_exe "$STAGED_APP")" || {
  echo "error: staging copy has no executable (ditto or bundle layout issue)." >&2
  exit 1
}
[[ -x "$EXE" ]] || chmod +x "$EXE"

xattr -cr "$STAGED_APP"

if [[ "${SKIP_DMG_CODESIGN:-}" != "1" ]]; then
  codesign --force --deep --sign - "$STAGED_APP"
fi

if [[ "$(uname -m)" == "arm64" ]]; then
  if ! lipo -archs "$EXE" 2>/dev/null | grep -qw arm64; then
    echo "error: this image is named *_arm64.dmg but the app binary has no arm64 slice." >&2
    echo "  Reported architectures: $(lipo -archs "$EXE" 2>&1)" >&2
    echo "  Rebuild on Apple Silicon or use: GOARCH=arm64 wails build" >&2
    exit 1
  fi
fi

ln -sf /Applications "${STAGING}/Applications"

rm -f "$OUT"
hdiutil create \
  -volname "Keyboard Sounds Pro" \
  -srcfolder "$STAGING" \
  -ov \
  -format UDZO \
  -imagekey zlib-level=9 \
  "$OUT"

echo "Created: $OUT"
