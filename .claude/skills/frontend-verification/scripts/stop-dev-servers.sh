#!/bin/bash

# stop-dev-servers.sh
# Zatrzymuje backend i frontend dev servers

set -e

BACKEND_PORT=8080
FRONTEND_PORT=4200
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
PID_DIR="${PROJECT_ROOT}/.claude/skills/frontend-verification/scripts"
BACKEND_PID_FILE="${PID_DIR}/backend.pid"
FRONTEND_PID_FILE="${PID_DIR}/frontend.pid"
BACKEND_LOG="${PID_DIR}/backend.log"
FRONTEND_LOG="${PID_DIR}/frontend.log"
SHUTDOWN_TIMEOUT=30

echo "=== Stopping Dev Servers ==="

check_port() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
}

kill_process() {
    local pid=$1
    local name=$2
    local timeout=$3

    if ! ps -p $pid > /dev/null 2>&1; then
        echo "⚠️  $name process (PID: $pid) not found - already stopped"
        return 0
    fi

    echo "🛑 Stopping $name (PID: $pid)..."
    kill -SIGTERM $pid 2>/dev/null || true

    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if ! ps -p $pid > /dev/null 2>&1; then
            echo "✅ $name stopped gracefully"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
        echo -n "."
    done

    echo ""
    echo "⚠️  $name did not stop gracefully, forcing shutdown..."
    kill -SIGKILL $pid 2>/dev/null || true
    sleep 2

    if ps -p $pid > /dev/null 2>&1; then
        echo "❌ Failed to stop $name (PID: $pid)"
        return 1
    else
        echo "✅ $name force-stopped"
        return 0
    fi
}

kill_by_port() {
    local port=$1
    local name=$2

    if check_port $port; then
        echo "⚠️  $name still running on port $port (no PID file)"
        local pid=$(lsof -ti:$port)
        if [ -n "$pid" ]; then
            echo "   Found process PID: $pid"
            kill_process $pid "$name" $SHUTDOWN_TIMEOUT
        fi
    fi
}

stopped_backend=false
stopped_frontend=false

# Stop Backend
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if kill_process $BACKEND_PID "Backend" $SHUTDOWN_TIMEOUT; then
        stopped_backend=true
        rm -f "$BACKEND_PID_FILE"
    fi
else
    echo "⚠️  Backend PID file not found"
    kill_by_port $BACKEND_PORT "Backend"
    stopped_backend=true
fi

# Stop Frontend
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if kill_process $FRONTEND_PID "Frontend" $SHUTDOWN_TIMEOUT; then
        stopped_frontend=true
        rm -f "$FRONTEND_PID_FILE"
    fi
else
    echo "⚠️  Frontend PID file not found"
    kill_by_port $FRONTEND_PORT "Frontend"
    stopped_frontend=true
fi

# Verify ports are free
echo ""
echo "=== Verification ==="

backend_free=false
frontend_free=false

if ! check_port $BACKEND_PORT; then
    echo "✅ Backend port $BACKEND_PORT is free"
    backend_free=true
else
    echo "❌ Backend port $BACKEND_PORT is still in use"
fi

if ! check_port $FRONTEND_PORT; then
    echo "✅ Frontend port $FRONTEND_PORT is free"
    frontend_free=true
else
    echo "❌ Frontend port $FRONTEND_PORT is still in use"
fi

# Cleanup logs
if [ $stopped_backend = true ] && [ $backend_free = true ]; then
    rm -f "$BACKEND_LOG"
fi

if [ $stopped_frontend = true ] && [ $frontend_free = true ]; then
    rm -f "$FRONTEND_LOG"
fi

echo ""
echo "=== Summary ==="

if [ $backend_free = true ] && [ $frontend_free = true ]; then
    echo "✅ Both servers stopped successfully"
    exit 0
else
    echo "⚠️  Some servers may still be running. Check manually:"
    echo "   lsof -i :$BACKEND_PORT"
    echo "   lsof -i :$FRONTEND_PORT"
    exit 1
fi
