#!/data/data/com.termux/files/usr/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

source "$PROJECT_DIR/config/config.sh"

API="http://127.0.0.1:$DASHBOARD_PORT/api/server-info"

# Ambil data dari API
DATA=$(curl -s "$API")

# Parsing data
IP=$(echo "$DATA" | sed -n 's/.*"ip":"\([^"]*\)".*/\1/p')

USERNAME=$(echo "$DATA" \
    | sed -n 's/.*"username":"\([^"]*\)".*/\1/p')

SSH_PORT_API=$(echo "$DATA" \
    | sed -n 's/.*"port":\([0-9]*\).*/\1/p')

# Fallback
[ -z "$IP" ] && IP="Tidak terdeteksi"
[ -z "$USERNAME" ] && USERNAME="$(whoami)"
[ -z "$SSH_PORT_API" ] && SSH_PORT_API="$SSH_PORT"

echo ""

echo "╔══════════════════════════════════════════════════╗"
echo "║              SUPERTINYSERVER ONLINE              ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║  DASHBOARD                                       ║"
echo "║  http://$IP:$DASHBOARD_PORT"
echo "║                                                  ║"
echo "║  SSH CONNECTION                                  ║"
echo "║  ssh -p $SSH_PORT_API $USERNAME@$IP"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"

echo ""
