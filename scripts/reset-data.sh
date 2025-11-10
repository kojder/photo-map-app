#!/bin/bash

################################################################################
# Photo Map MVP - Reset Data Script
################################################################################
# ⚠️  WARNING: This script DELETES ALL DATA!
# Use ONLY for:
#   - Development environment reset
#   - Initial production setup
#   - Testing scenarios
#
# What this script does:
#   1. Executes reset-data.sql (truncate tables, reset settings)
#   2. Deletes physical files from uploads/
#   3. Re-creates directory structure
#   4. Admin user will be created by backend on next restart (AdminInitializer)
#
# Usage:
#   ./scripts/reset-data.sh [options]
#
# Options:
#   --dry-run    Show what would be deleted without actually deleting
#   --help       Show this help message
#
# Example:
#   ./scripts/reset-data.sh               # Reset data (with confirmation)
#   ./scripts/reset-data.sh --dry-run     # Preview what would be deleted
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
UPLOADS_DIR="$BACKEND_DIR/uploads"
SQL_RESET_SCRIPT="$BACKEND_DIR/src/main/resources/db/reset-data.sql"

# Database config (read from .env)
ENV_FILE="$PROJECT_ROOT/.env"

# Parse options
DRY_RUN=false
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
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

load_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env file not found at $ENV_FILE"
        exit 1
    fi

    # Load database config
    export $(grep -E '^DB_HOST=' "$ENV_FILE" | xargs)
    export $(grep -E '^DB_PORT=' "$ENV_FILE" | xargs)
    export $(grep -E '^DB_NAME=' "$ENV_FILE" | xargs)
    export $(grep -E '^DB_USERNAME=' "$ENV_FILE" | xargs)
    export $(grep -E '^DB_PASSWORD=' "$ENV_FILE" | xargs)
}

check_postgres() {
    log_info "Checking PostgreSQL connection..."

    if ! command -v psql >/dev/null 2>&1; then
        log_error "psql not found. Install PostgreSQL client: sudo apt install postgresql-client"
        exit 1
    fi

    # Test connection
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT 1" >/dev/null 2>&1; then
        log_error "Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT"
        log_error "Make sure PostgreSQL is running: docker-compose up -d"
        exit 1
    fi

    log_success "PostgreSQL connection OK"
}

reset_database() {
    log_info "Resetting database..."

    if [ ! -f "$SQL_RESET_SCRIPT" ]; then
        log_error "SQL reset script not found at $SQL_RESET_SCRIPT"
        exit 1
    fi

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would execute SQL reset script: $SQL_RESET_SCRIPT"
        return 0
    fi

    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "$SQL_RESET_SCRIPT"

    if [ $? -eq 0 ]; then
        log_success "Database reset completed"
    else
        log_error "Database reset failed"
        exit 1
    fi
}

delete_uploads() {
    log_info "Deleting physical files from uploads/..."

    if [ ! -d "$UPLOADS_DIR" ]; then
        log_warn "Uploads directory not found: $UPLOADS_DIR"
        return 0
    fi

    # Count files before deletion
    local file_count=$(find "$UPLOADS_DIR" -type f | wc -l)
    log_info "Found $file_count files to delete"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would delete files from:"
        for dir in input original medium failed; do
            local dir_path="$UPLOADS_DIR/$dir"
            if [ -d "$dir_path" ]; then
                local count=$(find "$dir_path" -type f | wc -l)
                log_info "  - $dir/: $count files"
            fi
        done
        return 0
    fi

    # Delete files from all subdirectories
    for dir in input original medium failed; do
        local dir_path="$UPLOADS_DIR/$dir"
        if [ -d "$dir_path" ]; then
            rm -f "$dir_path"/*
            log_success "Deleted files from $dir/"
        fi
    done

    log_success "Upload files deleted"
}

recreate_directory_structure() {
    log_info "Verifying directory structure..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would verify/create directories:"
        log_info "  - $UPLOADS_DIR/input/"
        log_info "  - $UPLOADS_DIR/original/"
        log_info "  - $UPLOADS_DIR/medium/"
        log_info "  - $UPLOADS_DIR/failed/"
        return 0
    fi

    # Ensure all required directories exist
    mkdir -p "$UPLOADS_DIR/input"
    mkdir -p "$UPLOADS_DIR/original"
    mkdir -p "$UPLOADS_DIR/medium"
    mkdir -p "$UPLOADS_DIR/failed"

    log_success "Directory structure verified"
}

show_confirmation() {
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                         ⚠️  WARNING ⚠️                          ║${NC}"
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}║  This will DELETE ALL DATA:                                    ║${NC}"
    echo -e "${RED}║    - All users (including admin)                               ║${NC}"
    echo -e "${RED}║    - All photos and ratings                                    ║${NC}"
    echo -e "${RED}║    - All physical files from uploads/                          ║${NC}"
    echo -e "${RED}║    - Settings will be reset to defaults                        ║${NC}"
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}║  Admin user will be re-created on next backend restart         ║${NC}"
    echo -e "${RED}║  (using credentials from .env file)                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -n "Type 'yes' to confirm: "
    read -r confirmation

    if [ "$confirmation" != "yes" ]; then
        echo ""
        log_warn "Reset cancelled by user"
        exit 0
    fi
}

# ============================================================================
# Main
# ============================================================================

main() {
    echo ""
    log_info "=========================================="
    if [ "$DRY_RUN" = true ]; then
        log_info "Photo Map MVP - Reset Data (DRY-RUN)"
    else
        log_info "Photo Map MVP - Reset Data"
    fi
    log_info "=========================================="
    echo ""

    # Load environment variables
    load_env

    # Show confirmation (skip for dry-run)
    if [ "$DRY_RUN" = false ]; then
        show_confirmation
        echo ""
    fi

    # Check PostgreSQL connection
    check_postgres
    echo ""

    # Reset database
    reset_database
    echo ""

    # Delete upload files
    delete_uploads
    echo ""

    # Recreate directory structure
    recreate_directory_structure
    echo ""

    log_info "=========================================="
    if [ "$DRY_RUN" = true ]; then
        log_success "DRY-RUN completed - no actual changes made"
    else
        log_success "Data reset completed!"
    fi
    log_info "=========================================="
    echo ""

    if [ "$DRY_RUN" = false ]; then
        log_info "Next steps:"
        echo "  1. Restart backend to create admin user:"
        echo "     ./scripts/stop-dev.sh && ./scripts/start-dev.sh"
        echo ""
        echo "  2. Admin credentials from .env:"
        echo "     Email: $ADMIN_EMAIL (if set, otherwise check .env)"
        echo "     Password: (check ADMIN_PASSWORD in .env)"
        echo ""
    fi
}

main "$@"
