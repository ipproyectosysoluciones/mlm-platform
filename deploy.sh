#!/bin/bash

# ============================================
# MLM Platform - Production Deploy Script
# ============================================
# Usage: ./deploy.sh [version]
# Example: ./deploy.sh v1.0.0

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
VERSION=${1:-"latest"}
DOCKER_USER="ipproyectos"  # Cambiar esto
PROJECT_NAME="mlm-platform"

echo -e "${BLUE}🚀 MLM Platform Deploy Script${NC}"
echo -e "${BLUE}================================${NC}"

# Step 1: Check .env.production exists
echo -e "\n${GREEN}✓ Checking environment file...${NC}"
if [ ! -f .env.production ]; then
    echo -e "${RED}✗ .env.production not found!${NC}"
    echo "  Copy .env.production.example and fill in your values"
    exit 1
fi
echo "  .env.production found ✓"

# Step 2: Load environment variables
echo -e "\n${GREEN}✓ Loading environment variables...${NC}"
export $(cat .env.production | grep -v '^#' | xargs)

# Step 3: Build images
echo -e "\n${GREEN}✓ Building Docker images...${NC}"

echo "  Building backend..."
docker build -t ${DOCKER_USER}/${PROJECT_NAME}-backend:${VERSION} \
             -t ${DOCKER_USER}/${PROJECT_NAME}-backend:latest \
             -f backend/Dockerfile .

echo "  Building frontend..."
docker build -t ${DOCKER_USER}/${PROJECT_NAME}-frontend:${VERSION} \
             -t ${DOCKER_USER}/${PROJECT_NAME}-frontend:latest \
             -f frontend/Dockerfile .

# Step 4: Test locally (optional)
echo -e "\n${GREEN}✓ Starting local test...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo "  Waiting for services to start..."
sleep 10

# Health check
echo "  Running health checks..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/ || echo "000")

if [ "$BACKEND_HEALTH" = "200" ]; then
    echo "  Backend: ${GREEN}HEALTHY${NC} ✓"
else
    echo "  Backend: ${RED}UNHEALTHY${NC} (HTTP $BACKEND_HEALTH)"
fi

if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo "  Frontend: ${GREEN}HEALTHY${NC} ✓"
else
    echo "  Frontend: ${RED}UNHEALTHY${NC} (HTTP $FRONTEND_HEALTH)"
fi

# Step 5: Ask before pushing
echo -e "\n${BLUE}================================${NC}"
echo -e "${GREEN}✓ Build complete!${NC}"
echo ""
echo "Images created:"
echo "  - ${DOCKER_USER}/${PROJECT_NAME}-backend:${VERSION}"
echo "  - ${DOCKER_USER}/${PROJECT_NAME}-frontend:${VERSION}"
echo ""
read -p "Push to DockerHub? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Step 6: Login to DockerHub
    echo -e "\n${GREEN}✓ Logging in to DockerHub...${NC}"
    docker login

    # Step 7: Push images
    echo -e "\n${GREEN}✓ Pushing images...${NC}"
    docker push ${DOCKER_USER}/${PROJECT_NAME}-backend:${VERSION}
    docker push ${DOCKER_USER}/${PROJECT_NAME}-backend:latest
    docker push ${DOCKER_USER}/${PROJECT_NAME}-frontend:${VERSION}
    docker push ${DOCKER_USER}/${PROJECT_NAME}-frontend:latest
    
    echo -e "\n${GREEN}✅ Images pushed to DockerHub!${NC}"
else
    echo -e "\n${BLUE}Skipped push to DockerHub${NC}"
fi

echo -e "\n${BLUE}================================${NC}"
echo -e "${GREEN}✅ Deploy complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update docker-compose.prod.yml with your DockerHub user"
echo "  2. On VPS: docker-compose pull && docker-compose up -d"
echo ""
