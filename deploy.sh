#!/bin/bash

# ============================================
# MLM Platform - Production Deploy Script
# ============================================
# Usage: ./deploy.sh [version]
# Example: ./deploy.sh v1.3.0

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables
VERSION=${1:-"latest"}
IMAGE_BACKEND="ipproyectos/mlm-backend:${VERSION}"
IMAGE_FRONTEND="ipproyectos/mlm-frontend:${VERSION}"

echo -e "${BLUE}🚀 MLM Platform Deploy Script${NC}"
echo -e "${BLUE}================================${NC}"
echo "Version: ${VERSION}"

# Step 1: Check .env.production exists
echo -e "\n${GREEN}✓ Checking environment file...${NC}"
if [ ! -f .env.production ]; then
    echo -e "${RED}✗ .env.production not found!${NC}"
    echo "  Run: cp .env.production.example .env.production"
    echo "  Then edit .env.production with your values"
    exit 1
fi
echo "  .env.production found ✓"

# Step 2: Build images
echo -e "\n${GREEN}✓ Building Docker images...${NC}"

echo "  Building backend (Node 24)..."
docker build -t ${IMAGE_BACKEND} -t ipproyectos/mlm-backend:latest -f backend/Dockerfile .
echo "    ✓ Backend: ${IMAGE_BACKEND}"

echo "  Building frontend..."
docker build -t ${IMAGE_FRONTEND} -t ipproyectos/mlm-frontend:latest -f frontend/Dockerfile .
echo "    ✓ Frontend: ${IMAGE_FRONTEND}"

# Step 3: Load environment variables
echo -e "\n${GREEN}✓ Loading environment variables...${NC}"
export $(cat .env.production | grep -v '^#' | xargs)

# Step 4: Start services locally
echo -e "\n${GREEN}✓ Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo "  Waiting for services..."
sleep 15

# Step 5: Health check
echo -e "\n${GREEN}✓ Running health checks...${NC}"

BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/ 2>/dev/null || echo "000")

if [ "$BACKEND_HEALTH" = "200" ]; then
    echo -e "  Backend: ${GREEN}✓ HEALTHY${NC}"
else
    echo -e "  Backend: ${RED}✗ UNHEALTHY${NC} (HTTP $BACKEND_HEALTH)"
fi

if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo -e "  Frontend: ${GREEN}✓ HEALTHY${NC}"
else
    echo -e "  Frontend: ${RED}✗ UNHEALTHY${NC} (HTTP $FRONTEND_HEALTH)"
fi

# Step 6: Summary
echo -e "\n${BLUE}================================${NC}"
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo -e "${YELLOW}Images created:${NC}"
echo "  - ${IMAGE_BACKEND}"
echo "  - ${IMAGE_FRONTEND}"
echo ""
echo -e "${YELLOW}Local services running at:${NC}"
echo "  - Frontend: http://localhost:80"
echo "  - Backend:  http://localhost:3000"
echo "  - API Docs: http://localhost:3000/api-docs"
echo ""

# Step 7: Ask before pushing
read -p "Push to DockerHub? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${GREEN}✓ Logging in to DockerHub...${NC}"
    docker login
    
    echo -e "\n${GREEN}✓ Pushing images...${NC}"
    docker push ${IMAGE_BACKEND}
    docker push ipproyectos/mlm-backend:latest
    docker push ${IMAGE_FRONTEND}
    docker push ipproyectos/mlm-frontend:latest
    
    echo -e "\n${GREEN}✅ Images pushed to DockerHub!${NC}"
else
    echo -e "\n${BLUE}Skipped push to DockerHub${NC}"
fi

echo -e "\n${BLUE}================================${NC}"
echo -e "${GREEN}✅ Deploy complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps for production:${NC}"
echo "  1. On VPS: docker-compose -f docker-compose.prod.yml pull"
echo "  2. On VPS: docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo -e "${YELLOW}Or use Docker Compose directly:${NC}"
echo "  docker pull ipproyectos/mlm-backend:${VERSION}"
echo "  docker pull ipproyectos/mlm-frontend:${VERSION}"
echo ""
