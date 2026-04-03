#!/bin/bash

### Build, sign (Developer ID), and notarize a DMG for distribution outside the Mac App Store
### (e.g. download from your website). This does NOT use App Store provisioning profiles.
### The DMG contains the .app plus a symlink named "Applications" → /Applications for drag-to-install.
### Signing uses entitlements-direct.plist (not entitlements.plist): Developer ID builds must not embed
### com.apple.application-identifier / com.apple.developer.team-identifier without a provisioning profile,
### or AMFI rejects launch with "No matching profile found".
###
### Prerequisites:
###   - Apple Developer "Developer ID Application" certificate in your keychain.
###     List with: security find-identity -v -p codesigning
###   - For notarization, either:
###       a) Keychain profile from: xcrun notarytool store-credentials
###          then set NOTARY_KEYCHAIN_PROFILE to that profile name, or
###       b) Set NOTARIZE_APPLE_ID, NOTARIZE_APP_SPECIFIC_PASSWORD (app-specific password),
###          and NOTARIZE_TEAM_ID (defaults to CW6RB36J5X if unset).
###
### Optional:
###   SKIP_NOTARIZE=1  — sign the app and DMG only (no Apple notarization; for local testing).
###
### Personal / dev builds without this script:
###   cd desktop && wails build -platform darwin/universal

set -euox pipefail

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Developer ID Application (not "3rd Party Mac Developer Application" used for Mac App Store).
DEVELOPER_ID_APPLICATION="${DEVELOPER_ID_APPLICATION:-Developer ID Application: Nathanial Fiscaletti (CW6RB36J5X)}"

ENTITLEMENTS="${SCRIPT_DIR}/build/darwin/entitlements-direct.plist"
NOTARIZE_TEAM_ID="${NOTARIZE_TEAM_ID:-CW6RB36J5X}"

command -v jq >/dev/null 2>&1 || {
  echo "error: jq is required but not installed" >&2
  exit 1
}

if [[ ! -f "$ENTITLEMENTS" ]]; then
  echo "error: entitlements not found: $ENTITLEMENTS" >&2
  exit 1
fi

VERSION="$1"
tmp=$(mktemp)
jq --arg version "$VERSION" '.info.productVersion = $version' "${SCRIPT_DIR}/wails.json" > "$tmp" && mv "$tmp" "${SCRIPT_DIR}/wails.json"

restore_wails_json() {
  local t
  t=$(mktemp)
  jq --arg version "dev" '.info.productVersion = $version' "${SCRIPT_DIR}/wails.json" > "$t" && mv "$t" "${SCRIPT_DIR}/wails.json"
}
trap restore_wails_json EXIT

(
  cd "$SCRIPT_DIR"
  wails build -platform darwin/universal -clean
)

BUILD_DIR="${SCRIPT_DIR}/build/bin"
APP="${BUILD_DIR}/Keyboard Sounds Pro.app"
DMG_PATH="${BUILD_DIR}/Keyboard-Sounds-Pro-${VERSION}.dmg"

if [[ ! -d "$APP" ]]; then
  echo "error: application bundle not found: $APP" >&2
  exit 1
fi

if ! find_main_macho_exe "$APP" >/dev/null; then
  echo "error: this bundle has no macOS executable (Contents/MacOS is empty or has no Mach-O binary):" >&2
  echo "  $APP" >&2
  exit 1
fi

codesign --remove-signature "$APP"

cp -r "${SCRIPT_DIR}/bundled-profiles" "$APP/Contents/Resources/"
xattr -dr com.apple.quarantine "$APP/Contents/Resources/bundled-profiles" || true
cp "${SCRIPT_DIR}/iconfile.icns" "$APP/Contents/Resources/"
xattr -d com.apple.quarantine "$APP/Contents/Resources/iconfile.icns" || true

# Do not embed embedded.provisionprofile — that is for Mac App Store uploads only.

codesign --timestamp --options=runtime -s "$DEVELOPER_ID_APPLICATION" -v \
  --entitlements "$ENTITLEMENTS" "$APP"

codesign --verify --deep --strict --verbose=2 "$APP"

STAGE=$(mktemp -d)
cp -R "$APP" "$STAGE/"
# Standard drag-to-install layout: app + alias to the real Applications folder.
ln -sf /Applications "$STAGE/Applications"

rm -f "$DMG_PATH"
hdiutil create -volname "Keyboard Sounds Pro ${VERSION}" -srcfolder "$STAGE" -ov -format UDZO -fs HFS+ "$DMG_PATH"
rm -rf "$STAGE"

codesign --timestamp --sign "$DEVELOPER_ID_APPLICATION" -v "$DMG_PATH"

if [[ "${SKIP_NOTARIZE:-0}" == "1" ]]; then
  echo "SKIP_NOTARIZE=1: skipping notarization and stapler (DMG is signed only)."
  echo "Built: $DMG_PATH"
  exit 0
fi

NOTARY_ARGS=(--wait)
if [[ -n "${NOTARY_KEYCHAIN_PROFILE:-}" ]]; then
  NOTARY_ARGS+=(--keychain-profile "$NOTARY_KEYCHAIN_PROFILE")
elif [[ -n "${NOTARIZE_APPLE_ID:-}" && -n "${NOTARIZE_APP_SPECIFIC_PASSWORD:-}" ]]; then
  NOTARY_ARGS+=(--apple-id "$NOTARIZE_APPLE_ID" --password "$NOTARIZE_APP_SPECIFIC_PASSWORD" --team-id "$NOTARIZE_TEAM_ID")
else
  echo "error: notarization credentials required. Use one of:" >&2
  echo "  NOTARY_KEYCHAIN_PROFILE=<name from notarytool store-credentials>" >&2
  echo "  or NOTARIZE_APPLE_ID + NOTARIZE_APP_SPECIFIC_PASSWORD (+ optional NOTARIZE_TEAM_ID)" >&2
  echo "Or set SKIP_NOTARIZE=1 to build a signed DMG without submitting to Apple." >&2
  exit 1
fi

xcrun notarytool submit "$DMG_PATH" "${NOTARY_ARGS[@]}"
xcrun stapler staple "$DMG_PATH"

echo "Built and notarized: $DMG_PATH"
