#!/bin/bash
# ============================================
# MLM Platform - Full Stack Deploy Script
# ============================================
# Usage: ./deploy.sh [version]
# Example: ./deploy.sh v1.11.0

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

# Compile backend locally first
echo "⚙️  Compiling backend..."
cd backend && pnpm build && cd ..

# Copy lockfile into backend build context (lives at monorepo root)
echo "📋 Copying lockfile to backend build context..."
cp pnpm-lock.yaml backend/pnpm-lock.yaml

echo "📦 Building images..."
# Backend: context is ./backend (Dockerfile expects dist/ and pnpm-lock.yaml there)
docker build -t ${BACKEND_IMAGE} -f backend/Dockerfile ./backend
# Frontend: context is root (nginx.conf and dist/ are in frontend/)
docker build -t ${FRONTEND_IMAGE} -f frontend/Dockerfile .

# Cleanup temporary lockfile copy
rm -f backend/pnpm-lock.yaml

# Load env and start all services
export $(cat .env.production | grep -v '^#' | grep -v '^$' | xargs)
docker compose -f docker-compose.prod.yml up -d

# Wait for services to initialize
echo "⏳ Waiting for services to start..."
sleep 15

BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null || echo "000")

echo ""
[ "$BACKEND" = "200" ] && echo "✅ Backend:  healthy (port 3000)" || echo "❌ Backend:  unhealthy (HTTP $BACKEND)"
[ "$FRONTEND" = "200" ] && echo "✅ Frontend: healthy (port 3001)" || echo "❌ Frontend: unhealthy (HTTP $FRONTEND)"

echo ""
echo "📦 Images: ${BACKEND_IMAGE} | ${FRONTEND_IMAGE}"
echo "🌐 Backend:  http://localhost:3000"
echo "🌐 Frontend: http://localhost:3001"

read -p "Push to DockerHub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker login -u ipproyectos
    docker push ${BACKEND_IMAGE}
    docker push ipproyectos/mlm-backend:latest
    docker push ${FRONTEND_IMAGE}
    docker push ipproyectos/mlm-frontend:latest
    echo "✅ Pushed to DockerHub"
fi
