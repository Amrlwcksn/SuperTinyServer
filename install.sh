#!/data/data/com.termux/files/usr/bin/bash

set -e

# ==========================================
# SUPERTINYSERVER INSTALLER
# ==========================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "========================================"
echo "     SUPERTINYSERVER INSTALLER"
echo "========================================"
echo ""

echo "[1/5] Updating Termux packages..."
pkg update -y
pkg upgrade -y

echo ""
echo "[2/5] Installing dependencies..."
pkg install -y nodejs openssh curl

echo ""
echo "[3/5] Installing Node.js packages..."
cd "$PROJECT_DIR"
npm install

echo ""
echo "[4/5] Setting script permissions..."

chmod +x "$PROJECT_DIR/install.sh"

find "$PROJECT_DIR/scripts" \
    -type f \
    -name "*.sh" \
    -exec chmod +x {} \;

chmod +x "$PROJECT_DIR/config/config.sh"

echo ""
echo "[5/5] Configuring SuperTinyServer startup..."

BASHRC="$HOME/.bashrc"

STARTUP_LINE="$PROJECT_DIR/scripts/start.sh"

# Tambahkan hanya jika belum ada
if ! grep -Fxq "$STARTUP_LINE" "$BASHRC" 2>/dev/null; then

    cat >> "$BASHRC" << EOF

# ==========================================
# SUPERTINYSERVER AUTO START
# ==========================================

$STARTUP_LINE

EOF

fi

echo ""
echo "========================================"
echo " Installation completed successfully!"
echo "========================================"
echo ""

echo "SuperTinyServer location:"
echo "$PROJECT_DIR"

echo ""
echo "Starting SuperTinyServer..."

"$PROJECT_DIR/scripts/start.sh"
