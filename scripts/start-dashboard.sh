#!/data/data/com.termux/files/usr/bin/bash

# Lokasi project relatif terhadap script ini
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load konfigurasi
source "$PROJECT_DIR/config/config.sh"

# ==========================================
# START DASHBOARD
# ==========================================

# Pastikan folder logs ada
mkdir -p "$LOGS_DIR"

# Cek apakah Node server sudah berjalan
if pgrep -f "node.*server.js" > /dev/null; then
    exit 0
fi

# Jalankan dashboard
cd "$SERVER_DIR" || exit 1

nohup node "$SERVER_FILE" \
    > "$DASHBOARD_LOG" \
    2>&1 &

sleep 1
