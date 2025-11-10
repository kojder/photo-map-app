#!/bin/bash

# Photo Map MVP - Ngrok Tunnel Starter
# Starts ngrok for mobile testing
# Usage: ./scripts/start-ngrok.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_DIR="$SCRIPT_DIR/.pid"
ENV_FILE="$PROJECT_DIR/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    log_error ".env file not found!"
    log_info "Run: cp .env.example .env"
    log_info "Then edit .env and add your NGROK_AUTHTOKEN"
    exit 1
fi

# Load .env
source "$ENV_FILE"

# Check if token is set
if [ -z "$NGROK_AUTHTOKEN" ] || [ "$NGROK_AUTHTOKEN" = "paste_your_token_here" ]; then
    log_error "NGROK_AUTHTOKEN not set in .env!"
    log_info "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    log_info "Then edit .env and set NGROK_AUTHTOKEN=your_token"
    exit 1
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    log_error "ngrok is not installed!"
    log_info "Install with: sudo apt install ngrok"
    exit 1
fi

# Configure ngrok authtoken
log_info "Configuring ngrok authtoken..."
ngrok config add-authtoken "$NGROK_AUTHTOKEN" > /dev/null 2>&1
log_success "Authtoken configured"

# Check if frontend is running
log_info "Checking if frontend is running on port 4200..."
if ! curl -s http://localhost:4200 > /dev/null 2>&1; then
    log_error "Frontend is not running on port 4200!"
    log_info "Start it with: ./scripts/start-dev.sh --with-db"
    exit 1
fi
log_success "Frontend is running"

# Check if ngrok is already running
if [ -f "$PID_DIR/ngrok.pid" ]; then
    NGROK_PID=$(cat "$PID_DIR/ngrok.pid")
    if ps -p "$NGROK_PID" > /dev/null 2>&1; then
        log_warning "Ngrok already running (PID: $NGROK_PID)"
        log_info "Stop it with: ./scripts/stop-ngrok.sh"

        # Fetch current URL
        sleep 2
        PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

        if [ -n "$PUBLIC_URL" ]; then
            echo ""
            log_success "Current ngrok URL:"
            echo -e "${GREEN}$PUBLIC_URL${NC}"
            echo ""
            log_info "Open this URL on your mobile device!"
        fi

        exit 0
    fi
fi

# Create PID directory if it doesn't exist
mkdir -p "$PID_DIR"

# Start ngrok in background
log_info "Starting ngrok tunnel for port 4200..."
nohup ngrok http 4200 --log=stdout > "$PID_DIR/ngrok.log" 2>&1 &
NGROK_PID=$!
echo "$NGROK_PID" > "$PID_DIR/ngrok.pid"

# Wait for startup
sleep 3

# Check if process is running
if ! ps -p "$NGROK_PID" > /dev/null 2>&1; then
    log_error "Failed to start ngrok!"
    log_info "Check logs: cat $PID_DIR/ngrok.log"
    exit 1
fi

log_success "Ngrok started (PID: $NGROK_PID)"

# Fetch public URL
log_info "Fetching public URL..."
sleep 2

PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PUBLIC_URL" ]; then
    log_error "Failed to get ngrok URL!"
    log_info "Check ngrok dashboard: http://localhost:4040"
    log_info "Or check logs: cat $PID_DIR/ngrok.log"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Ngrok tunnel is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${GREEN}Public URL:${NC} $PUBLIC_URL"
echo ""
echo -e "  ${BLUE}Ngrok Dashboard:${NC} http://localhost:4040"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "Open the URL on your mobile device to test the app!"
log_warning "Note: Free ngrok URLs expire when you restart ngrok"
echo ""
log_info "To stop ngrok: ./scripts/stop-ngrok.sh"
log_info "To view logs: tail -f $PID_DIR/ngrok.log"
echo ""
