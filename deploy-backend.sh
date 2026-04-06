#!/bin/bash
# ============================================
# MLM Platform - Backend Deploy Script
# ============================================
# Deploys ONLY the backend to Docker Hub
# Frontend is deployed separately via Vercel
#
# Usage: ./deploy-backend.sh [version]
# Example: ./deploy-backend.sh v1.11.0

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

# Copy lockfile into backend build context (lives at monorepo root)
echo "📋 Copying lockfile to backend build context..."
cp pnpm-lock.yaml backend/pnpm-lock.yaml

# Build image (context: ./backend — Dockerfile expects dist/ and pnpm-lock.yaml there)
echo "📦 Building backend image..."
docker build -t ${BACKEND_IMAGE} -f backend/Dockerfile ./backend
docker tag ${BACKEND_IMAGE} ipproyectos/mlm-backend:latest

# Cleanup temporary lockfile copy
rm -f backend/pnpm-lock.yaml

# Test local (bring up postgres + redis + backend together)
echo ""
echo "🔍 Testing backend locally (starting all services)..."
export $(cat .env.production | grep -v '^#' | grep -v '^$' | xargs)
docker compose -f docker-compose.prod.yml up -d

sleep 15

BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")

if [ "$BACKEND" = "200" ]; then
    echo "✅ Backend: healthy"
else
    echo "❌ Backend: unhealthy (HTTP $BACKEND)"
    echo "   Check logs: docker compose -f docker-compose.prod.yml logs backend"
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
