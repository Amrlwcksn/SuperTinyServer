#!/data/data/com.termux/files/usr/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASHRC="$HOME/.bashrc"
STARTUP_LINE="$PROJECT_DIR/scripts/start.sh"

echo ""
echo "========================================"
echo "    SUPERTINYSERVER UNINSTALLER"
echo "========================================"
echo ""

# Hapus baris startup dari .bashrc
if [ -f "$BASHRC" ]; then
    sed -i "\|$STARTUP_LINE|d" "$BASHRC"
fi

echo "SuperTinyServer startup removed from .bashrc."

echo ""
echo "Stopping dashboard..."

pkill -f "node.*server.js" 2>/dev/null || true

echo "Dashboard stopped."

echo ""
echo "Uninstall completed."
echo ""
echo "Project files are still available at:"
echo "$PROJECT_DIR"
echo ""
echo "If you want to delete the entire project manually:"
echo "rm -rf \"$PROJECT_DIR\""
