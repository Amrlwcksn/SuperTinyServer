#!/data/data/com.termux/files/usr/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

source "$PROJECT_DIR/config/config.sh"

API="http://127.0.0.1:$DASHBOARD_PORT/api/server-info"

echo ""
echo "Starting SuperTinyServer..."
echo ""

# ==========================================
# 1. START SSH SERVER
# ==========================================

echo "[1/3] Starting SSH Server..."
"$SCRIPTS_DIR/start-ssh.sh"


# ==========================================
# 2. START DASHBOARD
# ==========================================

echo "[2/3] Starting Dashboard..."
"$SCRIPTS_DIR/start-dashboard.sh"


# ==========================================
# 3. WAIT FOR DASHBOARD
# ==========================================

echo "[3/3] Waiting for Dashboard..."

for i in {1..10}; do

    if curl -s "$API" > /dev/null 2>&1; then
        break
    fi

    sleep 1

done


# ==========================================
# CHECK DASHBOARD
# ==========================================

if ! curl -s "$API" > /dev/null 2>&1; then

    echo ""
    echo "ERROR: Dashboard failed to start."
    echo "Check log:"
    echo "$DASHBOARD_LOG"

    exit 1

fi


# ==========================================
# DISPLAY SERVER INFO
# ==========================================

"$SCRIPTS_DIR/info.sh"


# ==========================================
# OPEN DASHBOARD IN BROWSER
# ==========================================

DATA=$(curl -s "$API")

IP=$(printf '%s' "$DATA" \
    | grep -o '"ip":"[^"]*"' \
    | cut -d'"' -f4)

if [ -n "$IP" ]; then

    DASHBOARD_URL="http://$IP:$DASHBOARD_PORT"

    echo "Opening dashboard..."
    echo "$DASHBOARD_URL"
    echo ""

    if command -v termux-open-url >/dev/null 2>&1; then

        termux-open-url "$DASHBOARD_URL"

    else

        am start \
            -a android.intent.action.VIEW \
            -d "$DASHBOARD_URL" \
            >/dev/null 2>&1

    fi

else

    echo "Dashboard started, but IP could not be detected."

fi
