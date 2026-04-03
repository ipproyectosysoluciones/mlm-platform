#!/bin/bash
# ============================================
# MLM Platform - Backend Deploy Script
# ============================================
# Deploys ONLY the backend to Docker Hub
# Frontend is deployed separately via Vercel
#
# Usage: ./deploy-backend.sh [version]
# Example: ./deploy-backend.sh v1.7.2

set -e

VERSION=${1:-latest}
BACKEND_IMAGE="ipproyectos/mlm-backend:${VERSION}"

echo "🚀 MLM Backend Deploy v${VERSION}"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "backend/Dockerfile" ]; then
    echo "❌ Error: backend/Dockerfile not found"
    echo "   Run this script from the project root"
    exit 1
fi

# Compile backend
echo "⚙️  Compiling backend..."
cd backend && pnpm build && cd ..

# Build image
echo "📦 Building backend image..."
docker build -t ${BACKEND_IMAGE} -f backend/Dockerfile ./backend
docker tag ${BACKEND_IMAGE} ipproyectos/mlm-backend:latest

# Test local
echo ""
echo "🔍 Testing backend locally..."
docker compose -f docker-compose.prod.yml up -d backend

sleep 10

BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")

if [ "$BACKEND" = "200" ]; then
    echo "✅ Backend: healthy"
else
    echo "❌ Backend: unhealthy (HTTP $BACKEND)"
    docker compose -f docker-compose.prod.yml down
    exit 1
fi

# Ask to push
echo ""
echo "📦 Image: ${BACKEND_IMAGE}"
read -p "Push to DockerHub? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔐 Logging in to DockerHub..."
    docker login -u ipproyectos
    
    echo "📤 Pushing images..."
    docker push ${BACKEND_IMAGE}
    docker push ipproyectos/mlm-backend:latest
    
    echo "✅ Pushed to DockerHub!"
    echo ""
    echo "🌐 Backend available at:"
    echo "   - Docker Hub: https://hub.docker.com/r/ipproyectos/mlm-backend"
    echo "   - Latest: docker pull ipproyectos/mlm-backend:latest"
else
    echo "⏭️  Skipped push"
fi

# Cleanup
docker compose -f docker-compose.prod.yml down

echo ""
echo "🎉 Deploy complete!"
