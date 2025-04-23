#!/bin/bash

# Script to create a DMG file for the codemodel-cli application

set -e

# Configuration
APP_NAME="CodeModel CLI"
VERSION="0.1.0"
DMG_NAME="${APP_NAME// /-}-${VERSION}.dmg"
BUILD_DIR="./build"
DMG_DIR="./dist"

# Create necessary directories
mkdir -p "$BUILD_DIR"
mkdir -p "$DMG_DIR"

# Build the app
echo "Building the application..."
npm install
npm pack

# Move the package to the build directory
mv *.tgz "$BUILD_DIR/"

# Create a simple installer script
cat > "$BUILD_DIR/install.sh" << EOL
#!/bin/bash
echo "Installing $APP_NAME..."
npm install -g --quiet \$(find . -name "codemodel-cli-*.tgz")
echo "Installation complete. You can now use the 'cw' command."
EOL

chmod +x "$BUILD_DIR/install.sh"

# Create a README for the DMG
cat > "$BUILD_DIR/README.txt" << EOL
$APP_NAME Installation

1. Double-click the install.sh script to install the CLI tool.
2. You can then use the 'cw' command in your terminal.

For usage instructions, type 'cw --help' in your terminal.
EOL

# Create the DMG using hdiutil
echo "Creating DMG..."
hdiutil create -volname "$APP_NAME" -srcfolder "$BUILD_DIR" -ov -format UDZO "$DMG_DIR/$DMG_NAME"

echo "DMG created: $DMG_DIR/$DMG_NAME"