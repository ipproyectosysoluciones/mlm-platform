#!/bin/bash
# ============================================
# MLM Platform - Deploy Script
# ============================================
# Usage: ./deploy.sh [version]
# Example: ./deploy.sh v1.3.0

set -e

VERSION=${1:-latest}
BACKEND_IMAGE="ipproyectos/mlm-backend:${VERSION}"
FRONTEND_IMAGE="ipproyectos/mlm-frontend:${VERSION}"

echo "🚀 MLM Platform Deploy v${VERSION}"

# Check .env.production
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found"
    exit 1
fi

# Build images
echo "📦 Building images..."
docker build -t ${BACKEND_IMAGE} -f backend/Dockerfile .
docker build -t ${FRONTEND_IMAGE} -f frontend/Dockerfile .

# Load env and start
export $(cat .env.production | grep -v '^#' | xargs)
docker compose -f docker-compose.prod.yml up -d

# Wait and check
sleep 15
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")

echo ""
[ "$BACKEND" = "200" ] && echo "✅ Backend: healthy" || echo "❌ Backend: unhealthy (HTTP $BACKEND)"
[ "$FRONTEND" = "200" ] && echo "✅ Frontend: healthy" || echo "❌ Frontend: unhealthy (HTTP $FRONTEND)"

echo ""
echo "📦 Images: ${BACKEND_IMAGE} ${FRONTEND_IMAGE}"
echo "🌐 Running at: http://localhost"

read -p "Push to DockerHub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker login
    docker push ${BACKEND_IMAGE}
    docker push ipproyectos/mlm-backend:latest
    docker push ${FRONTEND_IMAGE}
    docker push ipproyectos/mlm-frontend:latest
    echo "✅ Pushed to DockerHub"
fi
