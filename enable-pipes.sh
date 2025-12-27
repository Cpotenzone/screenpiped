#!/bin/bash
# Enable core pipes for Screenpipe

PIPES_DIR="$HOME/.screenpipe/pipes"
REPO_PIPES="$(pwd)/pipes"

echo "Enabling core pipes..."

# List of pipes to enable
PIPES_TO_ENABLE=(
  "obsidian"
  "search"
  "data-table"
  "meeting"
  "memories"
)

for pipe in "${PIPES_TO_ENABLE[@]}"; do
  echo "Setting up $pipe..."
  
  # Copy pipe from repo to user pipes directory
  if [ -d "$REPO_PIPES/$pipe" ]; then
    cp -r "$REPO_PIPES/$pipe" "$PIPES_DIR/"
    
    # Create pipe.json config
    cat > "$PIPES_DIR/$pipe/pipe.json" <<EOF
{
  "enabled": true,
  "source": "https://github.com/mediar-ai/screenpipe/tree/main/pipes/$pipe"
}
EOF
    
    echo "✓ $pipe enabled"
  else
    echo "✗ $pipe not found in $REPO_PIPES"
  fi
done

echo "Done! Pipes enabled:"
ls -1 "$PIPES_DIR"
