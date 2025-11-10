#!/bin/bash

################################################################################
# Photo Map MVP - Rebuild Script
################################################################################
# Rebuilds frontend and backend with optional data reset
#
# Usage:
#   ./scripts/rebuild.sh [options]
#
# Options:
#   --init       ⚠️  Reset ALL data (users, photos, files) to initial state
#                    Requires interactive confirmation
#   --skip-tests Skip tests during rebuild (faster, use for quick iterations)
#   --help       Show this help message
#
# Examples:
#   ./scripts/rebuild.sh                    # Normal rebuild
#   ./scripts/rebuild.sh --init             # Rebuild + reset data (DEV ONLY!)
#   ./scripts/rebuild.sh --skip-tests       # Fast rebuild without tests
#
# What this script does:
#   Standard rebuild:
#     1. Stop backend + frontend
#     2. Clean build (mvnw clean package + npm clean install)
#     3. Restart services
#
#   With --init flag:
#     1. Stop backend + frontend
#     2. Reset all data (calls reset-data.sh)
#     3. Clean build
#     4. Restart services (admin user auto-created)
#
# ⚠️  WARNING: --init flag DELETES ALL DATA!
#     Use ONLY in development or initial production setup
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Parse options
INIT_DATA=false
SKIP_TESTS=false

for arg in "$@"; do
    case $arg in
        --init)
            INIT_DATA=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help)
            grep '^#' "$0" | sed 's/^# //' | sed 's/^#//'
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# ============================================================================
# Functions
# ============================================================================

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

show_init_warning() {
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                         ⚠️  WARNING ⚠️                          ║${NC}"
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}║  --init flag will DELETE ALL DATA:                             ║${NC}"
    echo -e "${RED}║    • All users (including admin)                               ║${NC}"
    echo -e "${RED}║    • All photos and ratings                                    ║${NC}"
    echo -e "${RED}║    • All physical files from uploads/                          ║${NC}"
    echo -e "${RED}║    • Settings reset to defaults                                ║${NC}"
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}║  Use ONLY for:                                                 ║${NC}"
    echo -e "${RED}║    • Development environment reset                             ║${NC}"
    echo -e "${RED}║    • Initial production setup                                  ║${NC}"
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}║  Admin will be re-created from .env on restart                 ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

stop_services() {
    log_info "Stopping services..."

    if [ -f "$SCRIPT_DIR/stop-dev.sh" ]; then
        "$SCRIPT_DIR/stop-dev.sh" || true
    else
        log_warn "stop-dev.sh not found, services may still be running"
    fi

    log_success "Services stopped"
}

reset_data() {
    log_info "Resetting data..."

    if [ ! -f "$SCRIPT_DIR/reset-data.sh" ]; then
        log_error "reset-data.sh not found at $SCRIPT_DIR"
        exit 1
    fi

    "$SCRIPT_DIR/reset-data.sh"

    log_success "Data reset completed"
}

clean_backend() {
    log_info "Cleaning backend..."

    cd "$BACKEND_DIR"

    if [ "$SKIP_TESTS" = true ]; then
        log_info "Building backend (skipping tests)..."
        ./mvnw clean package -DskipTests
    else
        log_info "Building backend (with tests)..."
        ./mvnw clean package
    fi

    log_success "Backend cleaned and built"
}

clean_frontend() {
    log_info "Cleaning frontend..."

    cd "$FRONTEND_DIR"

    # Remove node_modules and package-lock for clean install
    if [ -d "node_modules" ]; then
        log_info "Removing node_modules..."
        rm -rf node_modules
    fi

    if [ -f "package-lock.json" ]; then
        rm -f package-lock.json
    fi

    log_info "Installing dependencies..."
    npm install

    if [ "$SKIP_TESTS" = false ]; then
        log_info "Running frontend tests..."
        npm test -- --watch=false --browsers=ChromeHeadless || {
            log_warn "Frontend tests failed, but continuing..."
        }
    else
        log_info "Skipping frontend tests"
    fi

    log_success "Frontend cleaned and dependencies installed"
}

start_services() {
    log_info "Starting services..."

    if [ -f "$SCRIPT_DIR/start-dev.sh" ]; then
        "$SCRIPT_DIR/start-dev.sh"
    else
        log_error "start-dev.sh not found at $SCRIPT_DIR"
        exit 1
    fi

    log_success "Services started"
}

# ============================================================================
# Main
# ============================================================================

main() {
    echo ""
    log_info "=========================================="
    log_info "Photo Map MVP - Rebuild"
    log_info "=========================================="
    echo ""

    # Show warning if --init flag is used
    if [ "$INIT_DATA" = true ]; then
        show_init_warning
    fi

    # Step 1: Stop services
    stop_services
    echo ""

    # Step 2: Reset data (if --init flag)
    if [ "$INIT_DATA" = true ]; then
        reset_data
        echo ""
    fi

    # Step 3: Clean backend
    clean_backend
    echo ""

    # Step 4: Clean frontend
    clean_frontend
    echo ""

    # Step 5: Start services
    start_services
    echo ""

    log_info "=========================================="
    log_success "Rebuild completed!"
    log_info "=========================================="
    echo ""

    if [ "$INIT_DATA" = true ]; then
        log_info "Data was reset. Admin user created from .env:"
        echo "  - Check backend logs for admin credentials"
        echo "  - Default: ADMIN_EMAIL and ADMIN_PASSWORD from .env"
        echo ""
    fi

    log_info "Services:"
    log_info "  - Backend:  http://localhost:8080"
    log_info "  - Frontend: http://localhost:4200"
    echo ""
}

main "$@"
