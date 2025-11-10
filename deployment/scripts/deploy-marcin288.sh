#!/bin/bash

################################################################################
# Photo Map - Deploy to marcin288.mikrus.xyz (Helper Script)
# Description: Calls deploy.sh with marcin288 VPS parameters
# Usage: ./deployment/scripts/deploy-marcin288.sh [options]
# Examples:
#   ./deployment/scripts/deploy-marcin288.sh           # Normal deployment
#   ./deployment/scripts/deploy-marcin288.sh --init    # Deploy + reset data
# Created: 2025-10-27
# Updated: 2025-11-10 (added --init flag support)
################################################################################

set -e

# marcin288 VPS configuration
SRV_HOST="marcin288.mikrus.xyz"
SSH_PORT="10288"
SSH_KEY="$HOME/.ssh/id_ed25519_mikrus"

# Colors
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse options
INIT_DATA=false
for arg in "$@"; do
    case $arg in
        --init)
            INIT_DATA=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --init    ⚠️  DANGER: Reset ALL data on production server"
            echo "            Deletes:"
            echo "              • All users (including admin)"
            echo "              • All photos and ratings"
            echo "              • All physical files from uploads/"
            echo "              • Settings reset to defaults"
            echo ""
            echo "            Use ONLY for:"
            echo "              • Initial production setup"
            echo "              • Development environment reset"
            echo ""
            echo "            Requires manual confirmation (type server hostname)"
            echo ""
            echo "Examples:"
            echo "  $0              # Normal deployment"
            echo "  $0 --init       # Deploy with data reset"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}Deploying to marcin288.mikrus.xyz...${NC}"
if [ "$INIT_DATA" = true ]; then
    echo -e "${RED}⚠️  Mode: INIT (will reset all data)${NC}"
fi
echo ""

# Call main deploy script with SSH key
export SSH_KEY
if [ "$INIT_DATA" = true ]; then
    ./deployment/scripts/deploy.sh "$SRV_HOST" "$SSH_PORT" --init
else
    ./deployment/scripts/deploy.sh "$SRV_HOST" "$SSH_PORT"
fi

echo ""
echo -e "${BLUE}🌐 Application URL:${NC}"
echo "   https://photos.tojest.dev/"
echo ""
echo -e "${BLUE}📋 Subdomain already configured:${NC}"
echo "   ✅ photos.tojest.dev → port 30288"
echo ""
echo -e "${BLUE}Test deployment:${NC}"
echo "   curl https://photos.tojest.dev/"
