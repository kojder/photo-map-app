#!/bin/bash

# ============================================
# Photo Map MVP - Development Stop Script
# ============================================
# Stops backend (Spring Boot) and frontend (Angular)
# with graceful shutdown and timeout
#
# Usage:
#   ./scripts/stop-dev.sh          # Stop backend + frontend
#   ./scripts/stop-dev.sh --with-db # Stop backend + frontend + PostgreSQL
# ============================================

# Colors for logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Debug mode (DEBUG=true ./scripts/stop-dev.sh)
DEBUG=${DEBUG:-false}

# Ports
BACKEND_PORT=8080
FRONTEND_PORT=4200

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_DIR="$SCRIPT_DIR/.pid"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# Timeout for graceful shutdown (seconds)
SHUTDOWN_TIMEOUT=30

# ============================================
# Helper Functions
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

debug_log() {
    if [ "$DEBUG" = true ]; then
        echo -e "${YELLOW}[DEBUG]${NC} $1" >&2
    fi
}

is_process_running() {
    local pid=$1
    kill -0 "$pid" 2>/dev/null
}

get_pid_from_port() {
    local port=$1
    debug_log "Searching for PID on port $port..."

    # Method 1: ss with PID
    if command -v ss >/dev/null 2>&1; then
        debug_log "Using ss -tlnp for port $port"
        local pid=$(ss -tlnp 2>/dev/null | grep ":${port} " | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -n1)
        if [ -n "$pid" ]; then
            debug_log "Found PID $pid (via ss)"
            echo "$pid"
            return 0
        fi
    fi

    # Method 2: lsof (fallback)
    if command -v lsof >/dev/null 2>&1; then
        debug_log "Using lsof for port $port"
        local pid=$(lsof -t -i:$port -sTCP:LISTEN 2>/dev/null | head -n1)
        if [ -n "$pid" ]; then
            debug_log "Found PID $pid (via lsof)"
            echo "$pid"
            return 0
        fi
    fi

    # Method 3: netstat (old but often available)
    if command -v netstat >/dev/null 2>&1; then
        debug_log "Using netstat for port $port"
        local pid=$(netstat -tlnp 2>/dev/null | grep ":${port} " | awk '{print $7}' | cut -d'/' -f1 | head -n1)
        if [ -n "$pid" ]; then
            debug_log "Found PID $pid (via netstat)"
            echo "$pid"
            return 0
        fi
    fi

    debug_log "PID not found for port $port"
    echo ""
}

stop_process() {
    local name=$1
    local pid=$2
    local timeout=${3:-$SHUTDOWN_TIMEOUT}

    if ! is_process_running $pid; then
        log_warn "$name (PID: $pid) is not running"
        return 0
    fi

    log_info "Stopping $name (PID: $pid)..."
    debug_log "Searching for child processes of PID $pid..."

    # Find all child processes
    local children=$(pgrep -P $pid 2>/dev/null || true)
    if [ -n "$children" ]; then
        debug_log "Found child processes: $children"
    fi

    # Send SIGTERM to main process (graceful shutdown)
    kill -TERM $pid 2>/dev/null || true

    # Send SIGTERM to all child processes
    if [ -n "$children" ]; then
        for child in $children; do
            debug_log "Sending SIGTERM to child PID $child"
            kill -TERM $child 2>/dev/null || true
        done
    fi

    # Wait for termination
    local elapsed=0
    while is_process_running $pid; do
        if [ $elapsed -ge $timeout ]; then
            log_warn "$name did not terminate within ${timeout}s, sending SIGKILL..."

            # SIGKILL to main process
            kill -9 $pid 2>/dev/null || true

            # SIGKILL to all children
            if command -v pkill >/dev/null 2>&1; then
                pkill -9 -P $pid 2>/dev/null || true
            else
                # Fallback: kill each child manually
                local remaining=$(pgrep -P $pid 2>/dev/null || true)
                for child in $remaining; do
                    kill -9 $child 2>/dev/null || true
                done
            fi

            sleep 1
            break
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done

    # Check if any child processes remain
    local remaining=$(pgrep -P $pid 2>/dev/null || true)
    if [ -n "$remaining" ]; then
        log_warn "Child processes remain: $remaining, killing..."
        for child in $remaining; do
            kill -9 $child 2>/dev/null || true
        done
    fi

    if is_process_running $pid; then
        log_error "$name (PID: $pid) still running after SIGKILL!"
        return 1
    else
        log_success "$name stopped"
        return 0
    fi
}

# ============================================
# Backend (Spring Boot)
# ============================================

stop_backend() {
    log_info "Checking backend..."

    local backend_pid=""

    # Check PID file
    if [ -f "$BACKEND_PID_FILE" ]; then
        backend_pid=$(cat "$BACKEND_PID_FILE")
        log_info "Found PID from file: $backend_pid"
    fi

    # If no PID file, try finding by port
    if [ -z "$backend_pid" ] || ! is_process_running $backend_pid; then
        log_info "Searching for process on port $BACKEND_PORT..."
        backend_pid=$(get_pid_from_port $BACKEND_PORT)
    fi

    # Stop main process
    if [ -n "$backend_pid" ] && is_process_running $backend_pid; then
        stop_process "Backend" $backend_pid
    else
        log_warn "Backend is not running"
    fi

    # Check for orphan processes on port
    local remaining_pid=$(get_pid_from_port $BACKEND_PORT)
    if [ -n "$remaining_pid" ] && is_process_running $remaining_pid; then
        log_warn "Found orphan process on port $BACKEND_PORT (PID: $remaining_pid), killing..."
        kill -9 $remaining_pid 2>/dev/null || true
        sleep 1
    fi

    rm -f "$BACKEND_PID_FILE"
}

# ============================================
# Frontend (Angular)
# ============================================

stop_frontend() {
    log_info "Checking frontend..."

    local frontend_pid=""

    # Check PID file
    if [ -f "$FRONTEND_PID_FILE" ]; then
        frontend_pid=$(cat "$FRONTEND_PID_FILE")
        log_info "Found PID from file: $frontend_pid"
    fi

    # If no PID file, try finding by port
    if [ -z "$frontend_pid" ] || ! is_process_running $frontend_pid; then
        log_info "Searching for process on port $FRONTEND_PORT..."
        frontend_pid=$(get_pid_from_port $FRONTEND_PORT)
    fi

    # Stop main process
    if [ -n "$frontend_pid" ] && is_process_running $frontend_pid; then
        stop_process "Frontend" $frontend_pid
    else
        log_warn "Frontend is not running"
    fi

    # Check for orphan processes on port
    local remaining_pid=$(get_pid_from_port $FRONTEND_PORT)
    if [ -n "$remaining_pid" ] && is_process_running $remaining_pid; then
        log_warn "Found orphan process on port $FRONTEND_PORT (PID: $remaining_pid), killing..."
        kill -9 $remaining_pid 2>/dev/null || true
        sleep 1
    fi

    rm -f "$FRONTEND_PID_FILE"
}

# ============================================
# PostgreSQL
# ============================================

stop_postgres() {
    log_info "Stopping PostgreSQL (docker-compose)..."
    cd "$PROJECT_ROOT"
    docker-compose down
    log_success "PostgreSQL stopped"
}

# ============================================
# Main
# ============================================

main() {
    echo ""
    log_info "=========================================="
    log_info "Photo Map MVP - Development Stop"
    log_info "=========================================="
    echo ""

    # Parse arguments
    STOP_DB=false
    for arg in "$@"; do
        case $arg in
            --with-db)
                STOP_DB=true
                shift
                ;;
        esac
    done

    # Stop backend
    stop_backend
    echo ""

    # Stop frontend
    stop_frontend
    echo ""

    # Stop PostgreSQL if --with-db
    if [ "$STOP_DB" = true ]; then
        stop_postgres
        echo ""
    fi

    log_info "=========================================="
    log_success "All services stopped!"
    log_info "=========================================="
    echo ""

    # Clean up PID folder if empty
    if [ -d "$PID_DIR" ] && [ -z "$(ls -A $PID_DIR/*.pid 2>/dev/null)" ]; then
        log_info "Removing empty log files..."
        rm -f "$PID_DIR"/*.log 2>/dev/null || true
    fi
}

main "$@"
