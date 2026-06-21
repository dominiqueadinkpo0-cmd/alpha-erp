#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Building frontend..."
cd "$SCRIPT_DIR/frontend"
npm install
npm run build

echo "Building desktop app..."
cd "$SCRIPT_DIR/desktop"
npm install
npm run build

echo "All builds complete!"
echo "Frontend: frontend/build/"
echo "Desktop: desktop/dist/"
