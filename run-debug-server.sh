#!/bin/bash

# Test script for Screenpipe with UI Plugin Installation Fix
# This runs the newly built debug binary with enhanced logging

echo "========================================="
echo "Screenpipe Debug Server with Plugin Fix"
echo "========================================="
echo ""
echo "Binary: $(pwd)/target/debug/screenpipe"
echo "Version: $(./target/debug/screenpipe --version 2>&1 | head -1)"
echo ""
echo "Features:"
echo "  ✅ Enhanced ZIP download validation"
echo "  ✅ HTTP status code checking"
echo "  ✅ Content-Type validation"
echo "  ✅ ZIP signature verification"
echo "  ✅ Detailed error messages"
echo ""
echo "Logs will be saved to: ~/.screenpipe/screenpipe.*.log"
echo ""
echo "To monitor plugin installation in real-time, run in another terminal:"
echo "  tail -f ~/.screenpipe/screenpipe.*.log | grep -E '(download|zip|HTTP|Content-Type|signature)'"
echo ""
echo "========================================="
echo "Starting server..."
echo "========================================="
echo ""

# Set debug logging for pipes module
export RUST_LOG="screenpipe_core::pipes=debug,screenpipe_server=info,info"

# Run the debug binary
./target/debug/screenpipe \
  --port 3030 \
  --enable-pipe-manager \
  --fps 0.5 \
  --audio-transcription-engine whisper-large-v3-turbo \
  --ocr-engine apple-native \
  "$@"
