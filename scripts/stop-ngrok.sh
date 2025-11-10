#!/bin/bash

# Photo Map MVP - Ngrok Tunnel Stopper
# Stops ngrok tunnel
# Usage: ./scripts/stop-ngrok.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if PID file exists
if [ ! -f "$PID_DIR/ngrok.pid" ]; then
    log_warning "Ngrok is not running (no PID file found)"
    exit 0
fi

# Read PID
NGROK_PID=$(cat "$PID_DIR/ngrok.pid")

# Check if process exists
if ! ps -p "$NGROK_PID" > /dev/null 2>&1; then
    log_warning "Ngrok process not found (PID: $NGROK_PID)"
    rm -f "$PID_DIR/ngrok.pid"
    exit 0
fi

# Stop ngrok
log_info "Stopping ngrok (PID: $NGROK_PID)..."
kill "$NGROK_PID" 2>/dev/null || true

# Wait for termination
sleep 1

# Check if process terminated
if ps -p "$NGROK_PID" > /dev/null 2>&1; then
    log_warning "Process still running, forcing kill..."
    kill -9 "$NGROK_PID" 2>/dev/null || true
    sleep 1
fi

# Remove PID file
rm -f "$PID_DIR/ngrok.pid"

log_success "Ngrok stopped"
