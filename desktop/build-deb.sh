#!/bin/bash

set -e

# Ensure the version is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# Build it using wails build
wails build

# Rename the binary to kbs-pro
mv ./build/bin/Keyboard\ Sounds\ Pro ./build/bin/kbs-pro

# Create a .deb package
DEB_BUILD_DIR="./build/deb"
APP_NAME="kbs-pro"
VERSION=$1
ARCHITECTURE="amd64"

# Clean up previous build
rm -rf "$DEB_BUILD_DIR"

# Create directory structure
mkdir -p "$DEB_BUILD_DIR/DEBIAN"
mkdir -p "$DEB_BUILD_DIR/usr/bin/$APP_NAME"
mkdir -p "$DEB_BUILD_DIR/usr/share/applications"
mkdir -p "$DEB_BUILD_DIR/usr/share/pixmaps"

# Copy binary
cp ./build/bin/kbs-pro "$DEB_BUILD_DIR/usr/bin/$APP_NAME/kbs-pro"
chmod +x "$DEB_BUILD_DIR/usr/bin/$APP_NAME/kbs-pro"

# Copy bundled-profiles
cp -r ./bundled-profiles "$DEB_BUILD_DIR/usr/bin/$APP_NAME/bundled-profiles"

# Copy icon
cp ./build/appicon.png "$DEB_BUILD_DIR/usr/share/pixmaps/$APP_NAME.png"

# Create .desktop file
cat > "$DEB_BUILD_DIR/usr/share/applications/$APP_NAME.desktop" << EOF
[Desktop Entry]
Name=Keyboard Sounds Pro
Comment=Add mechanical keyboard sounds to your typing
Exec=/usr/bin/$APP_NAME/kbs-pro
Icon=$APP_NAME
Terminal=false
Type=Application
Categories=Utility;Audio;
EOF

# Create control file
cat > "$DEB_BUILD_DIR/DEBIAN/control" << EOF
Package: $APP_NAME
Version: $VERSION
Architecture: $ARCHITECTURE
Maintainer: Keyboard Sounds Pro <support@keyboardsounds.pro>
Description: Add mechanical keyboard sounds to your typing
 Keyboard Sounds Pro allows you to add realistic mechanical keyboard
 and mouse click sounds to enhance your typing experience.
EOF

# Build the .deb package
dpkg-deb --build "$DEB_BUILD_DIR" "./build/${APP_NAME}_${VERSION}_${ARCHITECTURE}.deb"

# Clean up
rm -rf "$DEB_BUILD_DIR"

echo "✓ .deb package created: ./build/${APP_NAME}_${VERSION}_${ARCHITECTURE}.deb"
