#!/data/data/com.termux/files/usr/bin/bash

# Lokasi project
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load config
source "$PROJECT_DIR/config/config.sh"

# ==========================================
# START SSH SERVER
# ==========================================

# Jika belum berjalan, jalankan sshd
if ! pgrep -x sshd > /dev/null 2>&1; then
    sshd
fi
