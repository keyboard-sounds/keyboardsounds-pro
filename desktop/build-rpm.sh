#!/bin/bash

set -e

# Ensure the version is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# Replace version in wails.json
sed -i "16s/dev/$1/" wails.json

# Build it using wails build
wails build -tags webkit2_41

# Rename the binary to kbs-pro
mv ./build/bin/Keyboard\ Sounds\ Pro ./build/bin/kbs-pro

# Create RPM package
RPM_BUILD_DIR="$(pwd)/build/rpm"
APP_NAME="kbs-pro"
VERSION=$1
ARCHITECTURE="x86_64"

# Clean up previous build
rm -rf "$RPM_BUILD_DIR"
mkdir -p "$RPM_BUILD_DIR"/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS}

PROJ_DIR="$(pwd)"

# Create spec file with %install that copies from project dir
cat > "$RPM_BUILD_DIR/SPECS/$APP_NAME.spec" << SPECEOF
Name:       $APP_NAME
Version:    $VERSION
Release:    1
Summary:    Add mechanical keyboard sounds to your typing
License:    MIT
URL:        https://keyboardsounds.pro
Packager:   Keyboard Sounds Pro <support@keyboardsounds.pro>

%description
Keyboard Sounds Pro allows you to add realistic mechanical keyboard
and mouse click sounds to enhance your typing experience.

%install
mkdir -p %{buildroot}/usr/bin/$APP_NAME
mkdir -p %{buildroot}/usr/share/applications
mkdir -p %{buildroot}/usr/share/pixmaps

cp $PROJ_DIR/build/bin/kbs-pro %{buildroot}/usr/bin/$APP_NAME/kbs-pro
chmod +x %{buildroot}/usr/bin/$APP_NAME/kbs-pro
cp -r $PROJ_DIR/bundled-profiles %{buildroot}/usr/bin/$APP_NAME/
cp $PROJ_DIR/build/appicon.png %{buildroot}/usr/share/pixmaps/$APP_NAME.png

cat > %{buildroot}/usr/share/applications/$APP_NAME.desktop << DESKTOPEOF
[Desktop Entry]
Name=Keyboard Sounds Pro
Comment=Add mechanical keyboard sounds to your typing
Exec=/usr/bin/kbs-pro/kbs-pro
Icon=kbs-pro
Terminal=false
Type=Application
Categories=Utility;Audio;
DESKTOPEOF

%files
/usr/bin/$APP_NAME/kbs-pro
/usr/bin/$APP_NAME/bundled-profiles
/usr/share/applications/$APP_NAME.desktop
/usr/share/pixmaps/$APP_NAME.png

%dir /usr/bin/$APP_NAME
SPECEOF

# Build the RPM package
rpmbuild --define "_topdir $RPM_BUILD_DIR" -bb "$RPM_BUILD_DIR/SPECS/$APP_NAME.spec"

# Move RPM to build dir (rpmbuild puts it in RPMS/x86_64/)
RPM_FILE=$(find "$RPM_BUILD_DIR/RPMS" -name "*.rpm" -type f)
cp "$RPM_FILE" "./build/"
RPM_OUTPUT=$(basename "$RPM_FILE")

# Clean up
rm -rf "$RPM_BUILD_DIR"

echo "✓ .rpm package created: ./build/$RPM_OUTPUT"
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
Read