#!/bin/bash

################################################################################
# Photo Map - Build Docker Images Script
# Description: Builds backend JAR + frontend Angular + Docker images
# Usage: ./deployment/scripts/build-images.sh
# Created: 2025-10-27
################################################################################

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}Photo Map - Build Docker Images${NC}"
echo -e "${BLUE}===================================================${NC}"
echo ""

# Step 1: Build backend JAR
echo -e "${GREEN}Step 1: Building backend JAR...${NC}"
cd backend
./mvnw clean package -DskipTests
cd ..
echo -e "${GREEN}✓ Backend JAR built successfully${NC}"
echo ""

# Step 2: Build frontend Angular
echo -e "${GREEN}Step 2: Building frontend Angular...${NC}"
cd frontend
ng build --configuration production
cd ..
echo -e "${GREEN}✓ Frontend Angular built successfully${NC}"
echo ""

# Step 3: Build backend Docker image
echo -e "${GREEN}Step 3: Building backend Docker image...${NC}"
docker build -t photo-map-backend:latest backend/
echo -e "${GREEN}✓ Backend Docker image built successfully${NC}"
echo ""

# Step 4: Build frontend Docker image
echo -e "${GREEN}Step 4: Building frontend Docker image...${NC}"
docker build -t photo-map-frontend:latest frontend/
echo -e "${GREEN}✓ Frontend Docker image built successfully${NC}"
echo ""

# Step 5: Verify images
echo -e "${GREEN}Step 5: Verifying Docker images...${NC}"
docker images | grep photo-map
echo ""

echo -e "${GREEN}===================================================${NC}"
echo -e "${GREEN}✓ All images built successfully!${NC}"
echo -e "${GREEN}===================================================${NC}"
echo ""
echo "Next steps:"
echo "1. Transfer images to VPS: docker save photo-map-backend:latest | gzip > photo-map-backend.tar.gz"
echo "2. Or use deployment/scripts/deploy.sh for full deployment"
