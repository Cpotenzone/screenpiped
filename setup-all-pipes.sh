#!/bin/bash
# Complete pipe setup - install ALL pipes properly

set -e

PIPES_SRC="$(pwd)/pipes"
PIPES_DEST="$HOME/.screenpipe/pipes"

echo "🔧 Complete Pipe Setup"
echo "======================="
echo ""

# Ensure destination exists
mkdir -p "$PIPES_DEST"

# Get all pipe directories
cd "$PIPES_SRC"
AVAILABLE_PIPES=$(ls -d */ 2>/dev/null | sed 's/\///' | grep -v node_modules || true)

echo "📦 Available pipes:"
echo "$AVAILABLE_PIPES" | sed 's/^/  - /'
echo ""

for pipe in $AVAILABLE_PIPES; do
  echo "🔄 Setting up: $pipe"
  
  # Skip if not a valid pipe
  if [ ! -f "$PIPES_SRC/$pipe/package.json" ]; then
    echo "  ⚠️  No package.json, skipping"
    continue
  fi
  
  # Copy to destination
  echo "  📋 Copying files..."
  rm -rf "$PIPES_DEST/$pipe"
  cp -r "$PIPES_SRC/$pipe" "$PIPES_DEST/"
  
  # Get version from package.json
  VERSION=$(jq -r '.version // "0.0.0"' "$PIPES_DEST/$pipe/package.json")
  
  # Create/update pipe.json
  echo "  ⚙️  Creating config (v$VERSION)..."
  cat > "$PIPES_DEST/$pipe/pipe.json" <<EOF
{
  "enabled": true,
  "version": "$VERSION",
  "source": "https://github.com/mediar-ai/screenpipe/tree/main/pipes/$pipe"
}
EOF
  
  # Install dependencies
  echo "  📥 Installing dependencies..."
  cd "$PIPES_DEST/$pipe"
  if command -v bun &> /dev/null; then
    bun install --silent 2>&1 | head -3 || echo "  ⚠️  Dependency install had warnings (may be ok)"
  else
    npm install --silent 2>&1 | head -3 || echo "  ⚠️  Dependency install had warnings (may be ok)"
  fi
  
  echo "  ✅ $pipe ready (v$VERSION)"
  echo ""
done

cd "$PIPES_DEST"
INSTALLED_COUNT=$(ls -d */ 2>/dev/null | wc -l)

echo "✨ Setup complete!"
echo "📊 Total pipes installed: $INSTALLED_COUNT"
echo ""
echo "Installed pipes:"
ls -1 | sed 's/^/  ✓ /'
