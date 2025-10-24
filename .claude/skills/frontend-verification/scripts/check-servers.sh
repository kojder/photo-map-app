#!/bin/bash

# check-servers.sh
# Sprawdza status dev servers (backend port 8080, frontend port 4200)

set -e

BACKEND_PORT=8080
FRONTEND_PORT=4200

echo "=== Checking Dev Servers Status ==="

check_port() {
    local port=$1
    local name=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ $name: RUNNING (port $port)"
        return 0
    else
        echo "❌ $name: STOPPED (port $port)"
        return 1
    fi
}

backend_running=0
frontend_running=0

if check_port $BACKEND_PORT "Backend"; then
    backend_running=1
fi

if check_port $FRONTEND_PORT "Frontend"; then
    frontend_running=1
fi

echo ""
echo "=== Summary ==="

if [ $backend_running -eq 1 ] && [ $frontend_running -eq 1 ]; then
    echo "✅ Both servers are RUNNING"
    exit 0
elif [ $backend_running -eq 1 ] || [ $frontend_running -eq 1 ]; then
    echo "⚠️  Only one server is running"
    exit 1
else
    echo "❌ Both servers are STOPPED"
    exit 2
fi
