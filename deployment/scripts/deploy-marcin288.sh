#!/bin/bash

################################################################################
# Photo Map - Deploy to marcin288.mikrus.xyz (Helper Script)
# Description: Calls deploy.sh with marcin288 VPS parameters
# Usage: ./deployment/scripts/deploy-marcin288.sh
# Created: 2025-10-27
################################################################################

set -e

# marcin288 VPS configuration
SRV_HOST="marcin288.mikrus.xyz"
SSH_PORT="10288"
SSH_KEY="$HOME/.ssh/id_ed25519_mikrus"

# Colors
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Deploying to marcin288.mikrus.xyz...${NC}"
echo ""

# Call main deploy script with SSH key
export SSH_KEY
./deployment/scripts/deploy.sh "$SRV_HOST" "$SSH_PORT"

echo ""
echo -e "${BLUE}🌐 Application URL:${NC}"
echo "   https://photos.tojest.dev/"
echo ""
echo -e "${BLUE}📋 Subdomain already configured:${NC}"
echo "   ✅ photos.tojest.dev → port 30288"
echo ""
echo -e "${BLUE}Test deployment:${NC}"
echo "   curl https://photos.tojest.dev/"
