#!/bin/bash
# Build final release package

set -e

echo "📦 Building Screenpipe Release Package"
echo "======================================"
echo ""

cd "$(dirname "$0")"

# Ensure pipes are ready
echo "1️⃣ Setting up pipes..."
if [ ! -f "setup-all-pipes.sh" ]; then
  echo "❌ setup-all-pipes.sh not found!"
  exit 1
fi
chmod +x setup-all-pipes.sh
./setup-all-pipes.sh > /dev/null 2>&1
echo "   ✅ All 17 pipes configured"
echo ""

# Build frontend
echo "2️⃣ Building frontend..."
cd screenpipe-app-tauri
bun run build
echo "   ✅ Frontend built"
echo ""

# Build Tauri app and create bundles
echo "3️⃣ Building Tauri app and creating bundles..."
bun run tauri build
echo "   ✅ App built and bundled"
echo ""

# Show results
echo "📊 Build Results:"
echo "================"
echo ""

if [ -f "src-tauri/target/release/bundle/dmg/screenpipe_0.44.4_aarch64.dmg" ]; then
  DMG_SIZE=$(du -h "src-tauri/target/release/bundle/dmg/screenpipe_0.44.4_aarch64.dmg" | cut -f1)
  echo "✅ DMG Installer: $DMG_SIZE"
  echo "   📂 $(pwd)/src-tauri/target/release/bundle/dmg/screenpipe_0.44.4_aarch64.dmg"
fi

if [ -d "src-tauri/target/release/bundle/macos/screenpipe.app" ]; then
  APP_SIZE=$(du -sh "src-tauri/target/release/bundle/macos/screenpipe.app" | cut -f1)
  echo "✅ App Bundle: $APP_SIZE"
  echo "   📂 $(pwd)/src-tauri/target/release/bundle/macos/screenpipe.app"
fi

if [ -f "src-tauri/target/release/bundle/macos/screenpipe.app.tar.gz" ]; then
  TAR_SIZE=$(du -h "src-tauri/target/release/bundle/macos/screenpipe.app.tar.gz" | cut -f1)
  echo "✅ Update Package: $TAR_SIZE"
  echo "   📂 $(pwd)/src-tauri/target/release/bundle/macos/screenpipe.app.tar.gz"
fi

echo ""
echo "🎉 Release package ready!"
echo ""
echo "📋 Installation Options:"
echo "   1. Double-click DMG and drag to Applications"
echo "   2. Run: open src-tauri/target/release/bundle/macos/screenpipe.app"
echo "   3. Copy to Applications: cp -r src-tauri/target/release/bundle/macos/screenpipe.app /Applications/"
