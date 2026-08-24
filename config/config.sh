#!/data/data/com.termux/files/usr/bin/bash

# ==========================================
# SUPERTINYSERVER CONFIGURATION
# ==========================================

# Lokasi root project
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Folder penting
SERVER_DIR="$PROJECT_DIR/server"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
LOGS_DIR="$PROJECT_DIR/logs"

# File server
SERVER_FILE="$SERVER_DIR/server.js"

# Port
DASHBOARD_PORT=3000
SSH_PORT=8022

# Log
DASHBOARD_LOG="$LOGS_DIR/dashboard.log"
