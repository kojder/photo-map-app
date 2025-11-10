#!/bin/bash

################################################################################
# Photo Map - Deploy to Mikrus VPS Script
# Description: Transfer Docker images + deploy via docker-compose
# Usage: ./deployment/scripts/deploy.sh [srv_host] [ssh_port] [options]
# Example: ./deployment/scripts/deploy.sh marcin288.mikrus.xyz 10288
#          ./deployment/scripts/deploy.sh marcin288.mikrus.xyz 10288 --init
# Helper: ./deployment/scripts/deploy-marcin288.sh (uses your VPS config)
# Created: 2025-10-27
# Updated: 2025-11-10 (added --init flag support)
################################################################################

set -e  # Exit on any error

# SSH key configuration (use environment variable or default)
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_mikrus}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${YELLOW}Usage: $0 [srv_host] [ssh_port] [options]${NC}"
    echo -e "${YELLOW}Example: $0 marcin288.mikrus.xyz 10288${NC}"
    echo -e "${YELLOW}         $0 marcin288.mikrus.xyz 10288 --init${NC}"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo -e "${YELLOW}  --init    ⚠️  DANGER: Reset ALL data on production server${NC}"
    echo -e "${YELLOW}            Requires confirmation (type exact hostname)${NC}"
    exit 1
fi

SRV_HOST=$1
SSH_PORT=$2
INIT_DATA=false
REMOTE_PATH="/opt/photo-map"

# Parse optional flags
shift 2
for arg in "$@"; do
    case $arg in
        --init)
            INIT_DATA=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}Photo Map - Deploy to Mikrus VPS${NC}"
echo -e "${BLUE}===================================================${NC}"
echo ""
echo -e "${BLUE}Target: ${NC}$SRV_HOST:$SSH_PORT"
echo -e "${BLUE}Remote path: ${NC}$REMOTE_PATH"
if [ "$INIT_DATA" = true ]; then
    echo -e "${RED}Mode: ${NC}INIT (⚠️  will reset all data)"
fi
echo ""

# ============================================================================
# Functions for --init flag
# ============================================================================

show_init_warning() {
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                         ⚠️  DANGER ⚠️                           ║${NC}"
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}║  --init flag will DELETE ALL DATA on PRODUCTION SERVER:        ║${NC}"
    echo -e "${RED}║    • All users (including admin)                               ║${NC}"
    echo -e "${RED}║    • All photos and ratings                                    ║${NC}"
    echo -e "${RED}║    • All physical files from uploads/                          ║${NC}"
    echo -e "${RED}║    • Settings reset to defaults                                ║${NC}"
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}║  Use ONLY for:                                                 ║${NC}"
    echo -e "${RED}║    • Initial production setup                                  ║${NC}"
    echo -e "${RED}║    • Development environment reset                             ║${NC}"
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}║  Admin will be re-created from remote .env on restart          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}To confirm, type the EXACT server hostname:${NC} $SRV_HOST"
    echo -n "> "
    read -r confirmation

    if [ "$confirmation" != "$SRV_HOST" ]; then
        echo ""
        echo -e "${RED}Confirmation failed. You typed: '$confirmation'${NC}"
        echo -e "${RED}Expected: '$SRV_HOST'${NC}"
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 1
    fi

    echo ""
    echo -e "${GREEN}✓ Confirmation accepted. Proceeding with data reset...${NC}"
    echo ""
}

reset_remote_data() {
    echo -e "${GREEN}Step INIT: Resetting data on remote server...${NC}"

    # SSH/SCP options
    SSH_OPTS="-p $SSH_PORT"
    SCP_OPTS="-P $SSH_PORT"

    if [ -f "$SSH_KEY" ]; then
        SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
        SCP_OPTS="$SCP_OPTS -i $SSH_KEY"
    fi

    # Transfer reset-data.sql to remote
    local RESET_SQL_LOCAL="backend/src/main/resources/db/reset-data.sql"
    local RESET_SQL_REMOTE="$REMOTE_PATH/reset-data.sql"

    if [ ! -f "$RESET_SQL_LOCAL" ]; then
        echo -e "${RED}Error: $RESET_SQL_LOCAL not found${NC}"
        exit 1
    fi

    echo -e "${BLUE}Transferring reset-data.sql...${NC}"
    scp $SCP_OPTS "$RESET_SQL_LOCAL" root@$SRV_HOST:"$RESET_SQL_REMOTE"

    # Execute reset on remote
    echo -e "${BLUE}Executing database reset on remote...${NC}"
    ssh $SSH_OPTS root@$SRV_HOST << EOF
cd $REMOTE_PATH

# Read DB credentials from .env
if [ ! -f .env ]; then
    echo "Error: .env not found at $REMOTE_PATH"
    exit 1
fi

export \$(grep -E '^DB_HOST=' .env | xargs)
export \$(grep -E '^DB_PORT=' .env | xargs)
export \$(grep -E '^DB_NAME=' .env | xargs)
export \$(grep -E '^DB_USERNAME=' .env | xargs)
export \$(grep -E '^DB_PASSWORD=' .env | xargs)

# Execute SQL reset
echo "Executing reset-data.sql..."
PGPASSWORD="\$DB_PASSWORD" psql -h "\$DB_HOST" -p "\$DB_PORT" -U "\$DB_USERNAME" -d "\$DB_NAME" -f reset-data.sql

if [ \$? -eq 0 ]; then
    echo "✓ Database reset completed"
else
    echo "✗ Database reset failed"
    exit 1
fi

# Delete upload files
echo "Deleting upload files..."
rm -rf uploads/input/* uploads/original/* uploads/medium/* uploads/failed/* 2>/dev/null || true
echo "✓ Upload files deleted"

# Recreate directory structure
mkdir -p uploads/input uploads/original uploads/medium uploads/failed
echo "✓ Directory structure verified"

# Cleanup SQL file
rm -f reset-data.sql
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Remote data reset completed${NC}"
    else
        echo -e "${RED}✗ Remote data reset failed${NC}"
        exit 1
    fi

    echo ""
}

# ============================================================================
# Pre-deployment: Data Reset (if --init flag)
# ============================================================================

if [ "$INIT_DATA" = true ]; then
    show_init_warning
    reset_remote_data
fi

# ============================================================================
# Standard Deployment Steps
# ============================================================================

# Step 1: Check if images exist
echo -e "${GREEN}Step 1: Checking Docker images...${NC}"
if ! docker images | grep -q "photo-map-backend"; then
    echo "Error: photo-map-backend image not found. Run ./deployment/scripts/build-images.sh first."
    exit 1
fi
if ! docker images | grep -q "photo-map-frontend"; then
    echo "Error: photo-map-frontend image not found. Run ./deployment/scripts/build-images.sh first."
    exit 1
fi
echo -e "${GREEN}✓ Docker images found${NC}"
echo ""

# Step 2: Save Docker images
echo -e "${GREEN}Step 2: Saving Docker images...${NC}"
docker save photo-map-backend:latest | gzip > photo-map-backend.tar.gz
docker save photo-map-frontend:latest | gzip > photo-map-frontend.tar.gz
echo -e "${GREEN}✓ Images saved${NC}"
echo ""

# Step 3: Transfer files to VPS
echo -e "${GREEN}Step 3: Transferring files to VPS...${NC}"

# SSH options (ssh uses -p for port)
SSH_OPTS="-p $SSH_PORT"
# SCP options (scp uses -P for port)
SCP_OPTS="-P $SSH_PORT"

if [ -f "$SSH_KEY" ]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
    SCP_OPTS="$SCP_OPTS -i $SSH_KEY"
    echo -e "${BLUE}Using SSH key: $SSH_KEY${NC}"
fi

# Create remote directory
ssh $SSH_OPTS root@$SRV_HOST "mkdir -p $REMOTE_PATH"

# Transfer docker-compose.yml, docker-compose.prod.yml, and nginx.conf
scp $SCP_OPTS deployment/docker-compose.yml root@$SRV_HOST:$REMOTE_PATH/
scp $SCP_OPTS deployment/docker-compose.prod.yml root@$SRV_HOST:$REMOTE_PATH/
scp $SCP_OPTS deployment/nginx.conf root@$SRV_HOST:$REMOTE_PATH/

# Transfer .env (if exists)
if [ -f "deployment/.env" ]; then
    scp $SCP_OPTS deployment/.env root@$SRV_HOST:$REMOTE_PATH/
    echo -e "${GREEN}✓ .env transferred${NC}"
else
    echo -e "${YELLOW}⚠ deployment/.env not found - you need to create it on VPS${NC}"
fi

# Transfer Docker images
scp $SCP_OPTS photo-map-backend.tar.gz root@$SRV_HOST:$REMOTE_PATH/
scp $SCP_OPTS photo-map-frontend.tar.gz root@$SRV_HOST:$REMOTE_PATH/

echo -e "${GREEN}✓ Files transferred${NC}"
echo ""

# Step 4: Load images on VPS
echo -e "${GREEN}Step 4: Loading Docker images on VPS...${NC}"
ssh $SSH_OPTS root@$SRV_HOST << EOF
cd $REMOTE_PATH
docker load < photo-map-backend.tar.gz
docker load < photo-map-frontend.tar.gz
rm photo-map-*.tar.gz
echo "✓ Images loaded"
EOF
echo -e "${GREEN}✓ Images loaded on VPS${NC}"
echo ""

# Step 5: Start Docker Compose (with production override)
echo -e "${GREEN}Step 5: Starting Docker Compose...${NC}"
ssh $SSH_OPTS root@$SRV_HOST << EOF
cd $REMOTE_PATH
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo "✓ Containers started"
docker compose ps
EOF
echo -e "${GREEN}✓ Docker Compose started${NC}"
echo ""

# Step 6: Cleanup local files
echo -e "${GREEN}Step 6: Cleaning up local files...${NC}"
rm photo-map-backend.tar.gz photo-map-frontend.tar.gz
echo -e "${GREEN}✓ Cleanup done${NC}"
echo ""

# Step 7: Show logs
echo -e "${GREEN}Step 7: Showing container logs (last 20 lines)...${NC}"
ssh $SSH_OPTS root@$SRV_HOST "cd $REMOTE_PATH && docker compose logs --tail=20"
echo ""

echo -e "${GREEN}===================================================${NC}"
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${GREEN}===================================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check health: ssh $SSH_OPTS root@$SRV_HOST 'curl http://localhost:8080/actuator/health'"
echo "2. Check frontend: curl https://srvXX-PORT.wykr.es/ (replace with your domain)"
echo "3. View logs: ssh $SSH_OPTS root@$SRV_HOST 'cd $REMOTE_PATH && docker compose logs -f'"
