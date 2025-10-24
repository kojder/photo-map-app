#!/bin/bash

# ============================================
# Photo Map MVP - Development Stop Script
# ============================================
# Zatrzymuje backend (Spring Boot) i frontend (Angular)
# z graceful shutdown i timeoutem
#
# Usage:
#   ./scripts/stop-dev.sh          # Stop backend + frontend
#   ./scripts/stop-dev.sh --with-db # Stop backend + frontend + PostgreSQL
# ============================================

# Kolory dla logów
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Debug mode (DEBUG=true ./scripts/stop-dev.sh)
DEBUG=${DEBUG:-false}

# Porty
BACKEND_PORT=8080
FRONTEND_PORT=4200

# Ścieżki
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_DIR="$SCRIPT_DIR/.pid"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# Timeout dla graceful shutdown (sekundy)
SHUTDOWN_TIMEOUT=30

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

is_process_running() {
    local pid=$1
    kill -0 "$pid" 2>/dev/null
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

stop_process() {
    local name=$1
    local pid=$2
    local timeout=${3:-$SHUTDOWN_TIMEOUT}

    if ! is_process_running $pid; then
        log_warn "$name (PID: $pid) już nie działa"
        return 0
    fi

    log_info "Zatrzymuję $name (PID: $pid)..."
    debug_log "Szukam procesów potomnych PID $pid..."

    # Znajdź wszystkie procesy potomne
    local children=$(pgrep -P $pid 2>/dev/null || true)
    if [ -n "$children" ]; then
        debug_log "Znaleziono procesy potomne: $children"
    fi

    # Wyślij SIGTERM do procesu głównego (graceful shutdown)
    kill -TERM $pid 2>/dev/null || true

    # Wyślij SIGTERM do wszystkich procesów potomnych
    if [ -n "$children" ]; then
        for child in $children; do
            debug_log "Wysyłam SIGTERM do potomka PID $child"
            kill -TERM $child 2>/dev/null || true
        done
    fi

    # Czekaj na zakończenie
    local elapsed=0
    while is_process_running $pid; do
        if [ $elapsed -ge $timeout ]; then
            log_warn "$name nie zakończył się w ciągu ${timeout}s, wysyłam SIGKILL..."

            # SIGKILL do procesu głównego
            kill -9 $pid 2>/dev/null || true

            # SIGKILL do wszystkich potomków
            if command -v pkill >/dev/null 2>&1; then
                pkill -9 -P $pid 2>/dev/null || true
            else
                # Fallback: zabij każdego potomka ręcznie
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

    # Sprawdź czy pozostały jakieś procesy potomne
    local remaining=$(pgrep -P $pid 2>/dev/null || true)
    if [ -n "$remaining" ]; then
        log_warn "Pozostały procesy potomne: $remaining, zabijam..."
        for child in $remaining; do
            kill -9 $child 2>/dev/null || true
        done
    fi

    if is_process_running $pid; then
        log_error "$name (PID: $pid) nadal działa po SIGKILL!"
        return 1
    else
        log_success "$name zatrzymany"
        return 0
    fi
}

# ============================================
# Backend (Spring Boot)
# ============================================

stop_backend() {
    log_info "Sprawdzam backend..."

    local backend_pid=""

    # Sprawdź PID file
    if [ -f "$BACKEND_PID_FILE" ]; then
        backend_pid=$(cat "$BACKEND_PID_FILE")
        log_info "Znaleziono PID z pliku: $backend_pid"
    fi

    # Jeśli brak PID file, spróbuj znaleźć po porcie
    if [ -z "$backend_pid" ] || ! is_process_running $backend_pid; then
        log_info "Szukam procesu na porcie $BACKEND_PORT..."
        backend_pid=$(get_pid_from_port $BACKEND_PORT)
    fi

    # Zatrzymaj proces główny
    if [ -n "$backend_pid" ] && is_process_running $backend_pid; then
        stop_process "Backend" $backend_pid
    else
        log_warn "Backend nie działa"
    fi

    # Sprawdź czy pozostały jakieś procesy na porcie (orphans)
    local remaining_pid=$(get_pid_from_port $BACKEND_PORT)
    if [ -n "$remaining_pid" ] && is_process_running $remaining_pid; then
        log_warn "Znaleziono orphan process na porcie $BACKEND_PORT (PID: $remaining_pid), zabijam..."
        kill -9 $remaining_pid 2>/dev/null || true
        sleep 1
    fi

    rm -f "$BACKEND_PID_FILE"
}

# ============================================
# Frontend (Angular)
# ============================================

stop_frontend() {
    log_info "Sprawdzam frontend..."

    local frontend_pid=""

    # Sprawdź PID file
    if [ -f "$FRONTEND_PID_FILE" ]; then
        frontend_pid=$(cat "$FRONTEND_PID_FILE")
        log_info "Znaleziono PID z pliku: $frontend_pid"
    fi

    # Jeśli brak PID file, spróbuj znaleźć po porcie
    if [ -z "$frontend_pid" ] || ! is_process_running $frontend_pid; then
        log_info "Szukam procesu na porcie $FRONTEND_PORT..."
        frontend_pid=$(get_pid_from_port $FRONTEND_PORT)
    fi

    # Zatrzymaj proces główny
    if [ -n "$frontend_pid" ] && is_process_running $frontend_pid; then
        stop_process "Frontend" $frontend_pid
    else
        log_warn "Frontend nie działa"
    fi

    # Sprawdź czy pozostały jakieś procesy na porcie (orphans)
    local remaining_pid=$(get_pid_from_port $FRONTEND_PORT)
    if [ -n "$remaining_pid" ] && is_process_running $remaining_pid; then
        log_warn "Znaleziono orphan process na porcie $FRONTEND_PORT (PID: $remaining_pid), zabijam..."
        kill -9 $remaining_pid 2>/dev/null || true
        sleep 1
    fi

    rm -f "$FRONTEND_PID_FILE"
}

# ============================================
# PostgreSQL
# ============================================

stop_postgres() {
    log_info "Zatrzymuję PostgreSQL (docker-compose)..."
    cd "$PROJECT_ROOT"
    docker-compose down
    log_success "PostgreSQL zatrzymany"
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

    # Stop PostgreSQL jeśli --with-db
    if [ "$STOP_DB" = true ]; then
        stop_postgres
        echo ""
    fi

    log_info "=========================================="
    log_success "Wszystkie serwisy zatrzymane!"
    log_info "=========================================="
    echo ""

    # Wyczyść folder PID jeśli pusty
    if [ -d "$PID_DIR" ] && [ -z "$(ls -A $PID_DIR/*.pid 2>/dev/null)" ]; then
        log_info "Usuwam puste pliki logów..."
        rm -f "$PID_DIR"/*.log 2>/dev/null || true
    fi
}

main "$@"
