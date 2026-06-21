#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Installing desktop app dependencies..."
npm install

echo "Building frontend..."
cd ../frontend
npm run build

echo "Building desktop app..."
cd ../desktop
npm run build

echo "Desktop app build complete!"
echo "Output files are in desktop/dist/"
