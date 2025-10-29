#!/bin/bash

################################################################################
# Photo Map - Deploy to Mikrus VPS Script
# Description: Transfer Docker images + deploy via docker-compose
# Usage: ./deployment/scripts/deploy.sh [srv_host] [ssh_port]
# Example: ./deployment/scripts/deploy.sh marcin288.mikrus.xyz 10288
# Helper: ./deployment/scripts/deploy-marcin288.sh (uses your VPS config)
# Created: 2025-10-27
################################################################################

set -e  # Exit on any error

# SSH key configuration (use environment variable or default)
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_mikrus}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${YELLOW}Usage: $0 [srv_host] [ssh_port]${NC}"
    echo -e "${YELLOW}Example: $0 marcin288.mikrus.xyz 10288${NC}"
    exit 1
fi

SRV_HOST=$1
SSH_PORT=$2
REMOTE_PATH="/opt/photo-map"

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}Photo Map - Deploy to Mikrus VPS${NC}"
echo -e "${BLUE}===================================================${NC}"
echo ""
echo -e "${BLUE}Target: ${NC}$SRV_HOST:$SSH_PORT"
echo -e "${BLUE}Remote path: ${NC}$REMOTE_PATH"
echo ""

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
