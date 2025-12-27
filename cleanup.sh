#!/bin/bash
# Complete cleanup script for Screenpipe

echo "🧹 Complete Screenpipe Cleanup"
echo "=============================="
echo ""

# Kill all processes
echo "1️⃣ Killing all Screenpipe processes..."
pkill -9 screenpipe-app 2>/dev/null || true
pkill -9 screenpipe 2>/dev/null || true
pkill -9 bun 2>/dev/null || true
pkill -9 node 2>/dev/null || true
pkill -9 ffmpeg 2>/dev/null || true
sleep 2
echo "   ✅ Processes killed"
echo ""

# Clean app data
echo "2️⃣ Cleaning application data..."
rm -rf ~/Library/Application\ Support/screenpipe
rm -rf ~/Library/Caches/screenpipe
rm -rf ~/Library/Preferences/screenpipe*
rm -rf ~/.screenpipe
echo "   ✅ App data cleaned"
echo ""

# Clean pipes
echo "3️⃣ Cleaning pipes..."
rm -rf ~/.screenpipe/pipes
echo "   ✅ Pipes cleaned"
echo ""

# Clean build artifacts
echo "4️⃣ Cleaning build artifacts..."
cd "$(dirname "$0")"
rm -rf screenpipe-app-tauri/src-tauri/target/release/bundle
rm -rf screenpipe-app-tauri/out
echo "   ✅ Build artifacts cleaned"
echo ""

echo "✨ Cleanup complete!"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo "   1. Open System Preferences → Security & Privacy → Screen Recording"
echo "   2. Remove ALL Screenpipe entries"
echo "   3. Open System Preferences → Security & Privacy → Microphone"
echo "   4. Remove ALL Screenpipe entries"
echo ""
echo "Run ./build-release.sh to build a fresh deployment package"
