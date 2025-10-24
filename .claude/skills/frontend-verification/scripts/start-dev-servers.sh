#!/bin/bash

# start-dev-servers.sh
# Uruchamia backend (port 8080) i frontend (port 4200) jeśli nie są uruchomione

set -e

BACKEND_PORT=8080
FRONTEND_PORT=4200
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
PID_DIR="${PROJECT_ROOT}/.claude/skills/frontend-verification/scripts"
BACKEND_PID_FILE="${PID_DIR}/backend.pid"
FRONTEND_PID_FILE="${PID_DIR}/frontend.pid"
BACKEND_LOG="${PID_DIR}/backend.log"
FRONTEND_LOG="${PID_DIR}/frontend.log"
HEALTH_CHECK_TIMEOUT=120

echo "=== Starting Dev Servers ==="
echo "Project root: $PROJECT_ROOT"
echo ""

check_port() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
}

wait_for_backend() {
    echo "⏳ Waiting for backend to be ready (timeout: ${HEALTH_CHECK_TIMEOUT}s)..."
    local elapsed=0
    while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
        if curl -s http://localhost:${BACKEND_PORT}/actuator/health >/dev/null 2>&1; then
            echo "✅ Backend is ready!"
            return 0
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    echo ""
    echo "❌ Backend health check timeout after ${HEALTH_CHECK_TIMEOUT}s"
    return 1
}

wait_for_frontend() {
    echo "⏳ Waiting for frontend to be ready (timeout: ${HEALTH_CHECK_TIMEOUT}s)..."
    local elapsed=0
    while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
        if check_port $FRONTEND_PORT; then
            echo "✅ Frontend is ready!"
            return 0
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    echo ""
    echo "❌ Frontend startup timeout after ${HEALTH_CHECK_TIMEOUT}s"
    return 1
}

# Start Backend
if check_port $BACKEND_PORT; then
    echo "✅ Backend already running on port $BACKEND_PORT"
else
    echo "🚀 Starting backend..."
    cd "${PROJECT_ROOT}/${BACKEND_DIR}"
    ./mvnw spring-boot:run > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$BACKEND_PID_FILE"
    echo "   Backend PID: $BACKEND_PID (log: $BACKEND_LOG)"
    cd "$PROJECT_ROOT"

    if ! wait_for_backend; then
        echo "❌ Failed to start backend. Check logs: $BACKEND_LOG"
        exit 1
    fi
fi

# Start Frontend
if check_port $FRONTEND_PORT; then
    echo "✅ Frontend already running on port $FRONTEND_PORT"
else
    echo "🚀 Starting frontend..."
    cd "${PROJECT_ROOT}/${FRONTEND_DIR}"
    ng serve > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
    echo "   Frontend PID: $FRONTEND_PID (log: $FRONTEND_LOG)"
    cd "$PROJECT_ROOT"

    if ! wait_for_frontend; then
        echo "❌ Failed to start frontend. Check logs: $FRONTEND_LOG"
        exit 1
    fi
fi

echo ""
echo "=== Dev Servers Started Successfully ==="
echo "✅ Backend:  http://localhost:$BACKEND_PORT"
echo "✅ Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Logs:"
echo "  - Backend:  $BACKEND_LOG"
echo "  - Frontend: $FRONTEND_LOG"
