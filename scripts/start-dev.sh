#!/bin/bash

# ============================================
# Photo Map MVP - Development Start Script
# ============================================
# Uruchamia backend (Spring Boot) i frontend (Angular)
# z automatycznym sprawdzaniem procesów w tle
#
# Usage:
#   ./scripts/start-dev.sh          # Start backend + frontend
#   ./scripts/start-dev.sh --with-db # Start PostgreSQL + backend + frontend
# ============================================

# Kolory dla logów
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Debug mode (DEBUG=true ./scripts/start-dev.sh)
DEBUG=${DEBUG:-false}

# Porty
BACKEND_PORT=8080
FRONTEND_PORT=4200
POSTGRES_PORT=5432

# Ścieżki
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_DIR="$SCRIPT_DIR/.pid"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# ============================================
# Funkcje pomocnicze
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

is_port_in_use() {
    local port=$1
    debug_log "Sprawdzam port $port..."

    # Metoda 1: ss (socket statistics) - działa bez sudo
    if command -v ss >/dev/null 2>&1; then
        debug_log "Używam ss dla portu $port"
        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            debug_log "Port $port jest zajęty (wykryte przez ss)"
            return 0
        fi
    fi

    # Metoda 2: lsof (fallback)
    if command -v lsof >/dev/null 2>&1; then
        debug_log "Używam lsof dla portu $port"
        if lsof -i:$port -sTCP:LISTEN >/dev/null 2>&1; then
            debug_log "Port $port jest zajęty (wykryte przez lsof)"
            return 0
        fi
    fi

    # Metoda 3: nc (netcat) - ostateczny fallback
    if command -v nc >/dev/null 2>&1; then
        debug_log "Używam nc dla portu $port"
        if nc -zv localhost $port >/dev/null 2>&1; then
            debug_log "Port $port jest zajęty (wykryte przez nc)"
            return 0
        fi
    fi

    debug_log "Port $port jest wolny"
    return 1
}

get_pid_from_port() {
    local port=$1
    debug_log "Szukam PID dla portu $port..."

    # Metoda 1: ss z PID
    if command -v ss >/dev/null 2>&1; then
        debug_log "Używam ss -tlnp dla portu $port"
        local pid=$(ss -tlnp 2>/dev/null | grep ":${port} " | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -n1)
        if [ -n "$pid" ]; then
            debug_log "Znaleziono PID $pid (przez ss)"
            echo "$pid"
            return 0
        fi
    fi

    # Metoda 2: lsof (fallback)
    if command -v lsof >/dev/null 2>&1; then
        debug_log "Używam lsof dla portu $port"
        local pid=$(lsof -t -i:$port -sTCP:LISTEN 2>/dev/null | head -n1)
        if [ -n "$pid" ]; then
            debug_log "Znaleziono PID $pid (przez lsof)"
            echo "$pid"
            return 0
        fi
    fi

    # Metoda 3: netstat (stary, ale często dostępny)
    if command -v netstat >/dev/null 2>&1; then
        debug_log "Używam netstat dla portu $port"
        local pid=$(netstat -tlnp 2>/dev/null | grep ":${port} " | awk '{print $7}' | cut -d'/' -f1 | head -n1)
        if [ -n "$pid" ]; then
            debug_log "Znaleziono PID $pid (przez netstat)"
            echo "$pid"
            return 0
        fi
    fi

    debug_log "Nie znaleziono PID dla portu $port"
    echo ""
}

is_process_running() {
    local pid=$1
    kill -0 "$pid" 2>/dev/null
}

wait_for_port() {
    local port=$1
    local timeout=${2:-30}
    local elapsed=0

    while ! is_port_in_use $port; do
        if [ $elapsed -ge $timeout ]; then
            return 1
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    return 0
}

check_backend_health() {
    debug_log "Sprawdzam backend health endpoint..."
    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -sf http://localhost:$BACKEND_PORT/actuator/health 2>/dev/null)
        if echo "$response" | grep -q "UP"; then
            debug_log "Backend health: UP"
            return 0
        fi
    fi
    debug_log "Backend health: niedostępny"
    return 1
}

check_frontend_health() {
    debug_log "Sprawdzam frontend health..."
    if command -v curl >/dev/null 2>&1; then
        local status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$FRONTEND_PORT 2>/dev/null)
        if [ "$status" = "200" ]; then
            debug_log "Frontend health: 200 OK"
            return 0
        fi
    fi
    debug_log "Frontend health: niedostępny"
    return 1
}

# ============================================
# PostgreSQL
# ============================================

start_postgres() {
    log_info "Sprawdzam PostgreSQL..."

    if is_port_in_use $POSTGRES_PORT; then
        log_success "PostgreSQL już działa na porcie $POSTGRES_PORT"
        return 0
    fi

    log_info "Uruchamiam PostgreSQL (docker-compose)..."
    cd "$PROJECT_ROOT"
    docker-compose up -d

    log_info "Czekam na PostgreSQL..."
    if wait_for_port $POSTGRES_PORT 30; then
        log_success "PostgreSQL uruchomiony"
    else
        log_error "PostgreSQL nie wystartował w ciągu 30s"
        exit 1
    fi
}

# ============================================
# Backend (Spring Boot)
# ============================================

start_backend() {
    log_info "Sprawdzam backend..."

    # Sprawdź czy backend już działa
    if is_port_in_use $BACKEND_PORT; then
        local pid=$(get_pid_from_port $BACKEND_PORT)
        log_warn "Backend już działa na porcie $BACKEND_PORT (PID: $pid)"
        echo "$pid" > "$BACKEND_PID_FILE"
        return 0
    fi

    # Sprawdź czy istnieje stary PID file
    if [ -f "$BACKEND_PID_FILE" ]; then
        local old_pid=$(cat "$BACKEND_PID_FILE")
        if is_process_running $old_pid; then
            log_warn "Backend już działa (PID: $old_pid)"
            return 0
        else
            rm "$BACKEND_PID_FILE"
        fi
    fi

    log_info "Uruchamiam backend (Spring Boot)..."
    cd "$BACKEND_DIR"

    # Uruchom w tle i zapisz PID
    ./mvnw spring-boot:run > "$PID_DIR/backend.log" 2>&1 &
    local backend_pid=$!
    echo "$backend_pid" > "$BACKEND_PID_FILE"

    log_info "Backend startuje... (PID: $backend_pid, port: $BACKEND_PORT)"
    log_info "Logi: $PID_DIR/backend.log"

    if wait_for_port $BACKEND_PORT 60; then
        log_success "Backend uruchomiony na http://localhost:$BACKEND_PORT"
    else
        log_error "Backend nie wystartował w ciągu 60s. Sprawdź logi: $PID_DIR/backend.log"
        exit 1
    fi
}

# ============================================
# Frontend (Angular)
# ============================================

start_frontend() {
    log_info "Sprawdzam frontend..."

    # Sprawdź czy frontend już działa
    if is_port_in_use $FRONTEND_PORT; then
        local pid=$(get_pid_from_port $FRONTEND_PORT)
        log_warn "Frontend już działa na porcie $FRONTEND_PORT (PID: $pid)"
        echo "$pid" > "$FRONTEND_PID_FILE"
        return 0
    fi

    # Sprawdź czy istnieje stary PID file
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local old_pid=$(cat "$FRONTEND_PID_FILE")
        if is_process_running $old_pid; then
            log_warn "Frontend już działa (PID: $old_pid)"
            return 0
        else
            rm "$FRONTEND_PID_FILE"
        fi
    fi

    log_info "Uruchamiam frontend (Angular)..."
    cd "$FRONTEND_DIR"

    # Sprawdź czy node_modules istnieje
    if [ ! -d "node_modules" ]; then
        log_info "node_modules nie istnieje, uruchamiam npm install..."
        npm install
    fi

    # Uruchom w tle i zapisz PID
    npm start > "$PID_DIR/frontend.log" 2>&1 &
    local frontend_pid=$!
    echo "$frontend_pid" > "$FRONTEND_PID_FILE"

    log_info "Frontend startuje... (PID: $frontend_pid, port: $FRONTEND_PORT)"
    log_info "Logi: $PID_DIR/frontend.log"

    if wait_for_port $FRONTEND_PORT 90; then
        log_success "Frontend uruchomiony na http://localhost:$FRONTEND_PORT"
    else
        log_error "Frontend nie wystartował w ciągu 90s. Sprawdź logi: $PID_DIR/frontend.log"
        exit 1
    fi
}

# ============================================
# Main
# ============================================

main() {
    echo ""
    log_info "=========================================="
    log_info "Photo Map MVP - Development Start"
    log_info "=========================================="
    echo ""

    # Parse arguments
    START_DB=false
    for arg in "$@"; do
        case $arg in
            --with-db)
                START_DB=true
                shift
                ;;
        esac
    done

    # Stwórz folder na PID files
    mkdir -p "$PID_DIR"

    # Start PostgreSQL jeśli --with-db LUB jeśli nie działa (automatycznie)
    if [ "$START_DB" = true ]; then
        start_postgres
        echo ""
    else
        # Sprawdź czy PostgreSQL działa
        if ! is_port_in_use $POSTGRES_PORT; then
            log_warn "PostgreSQL nie działa - uruchamiam automatycznie..."
            start_postgres
            echo ""
        else
            log_success "PostgreSQL działa na porcie $POSTGRES_PORT"
            echo ""
        fi
    fi

    # Start backend
    start_backend
    echo ""

    # Start frontend
    start_frontend
    echo ""

    log_info "=========================================="
    log_success "Wszystkie serwisy uruchomione!"
    log_info "=========================================="
    echo ""

    # Weryfikacja health endpoints
    log_info "Weryfikuję health endpoints..."
    echo ""

    if check_backend_health; then
        log_success "✅ Backend health: OK (http://localhost:$BACKEND_PORT/actuator/health)"
    else
        log_warn "⚠️  Backend health: NIEDOSTĘPNY (może jeszcze startować...)"
    fi

    if check_frontend_health; then
        log_success "✅ Frontend health: OK (http://localhost:$FRONTEND_PORT)"
    else
        log_warn "⚠️  Frontend health: NIEDOSTĘPNY (może jeszcze startować...)"
    fi

    echo ""
    log_info "=========================================="
    echo ""
    log_info "Backend:  http://localhost:$BACKEND_PORT"
    log_info "Frontend: http://localhost:$FRONTEND_PORT"
    echo ""
    log_info "Zatrzymaj wszystko: ./scripts/stop-dev.sh"
    log_info "Logi:"
    log_info "  - Backend:  $PID_DIR/backend.log"
    log_info "  - Frontend: $PID_DIR/frontend.log"
    echo ""
}

main "$@"
