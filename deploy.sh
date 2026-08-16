#!/bin/bash
# ============================================
# Nexo Real - Deploy Script (Backend + Bot)
# ============================================
# Frontend is deployed on Vercel — not part of Docker stack.
# Usage: ./deploy.sh [version]
# Example: ./deploy.sh v3.2.0

set -e

VERSION=${1:-latest}
BACKEND_IMAGE="ipproyectos/mlm-backend:${VERSION}"
BOT_IMAGE="ipproyectos/mlm-bot:${VERSION}"

echo "🚀 Nexo Real Deploy v${VERSION}"

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
docker build -t ${BACKEND_IMAGE}:latest -f backend/Dockerfile ./backend

# Bot: context is ./bot (multi-stage build, prompt_kb baked in)
docker build -t ${BOT_IMAGE} -f bot/Dockerfile ./bot
docker build -t ${BOT_IMAGE}:latest -f bot/Dockerfile ./bot

# Cleanup temporary lockfile copy
rm -f backend/pnpm-lock.yaml

# Load env and start all services (no frontend — Vercel)
echo "🐳 Starting services..."
if [ -f .env.production.local ]; then
  docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.production.local up -d
else
  docker compose -f docker-compose.prod.yml --env-file .env.production up -d
fi

# Wait for services to initialize
echo "⏳ Waiting for services to start..."
sleep 20

BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
N8N=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/healthz 2>/dev/null || echo "000")

echo ""
[ "$BACKEND" = "200" ] && echo "✅ Backend:  healthy (port 3000)" || echo "❌ Backend:  unhealthy (HTTP $BACKEND)"
[ "$N8N" = "200" ] && echo "✅ n8n:      healthy (port 5678)" || echo "❌ n8n:      unhealthy (HTTP $N8N)"
echo "🤖 Bot:      check logs → docker logs mlm-bot"

echo ""
echo "📦 Images: ${BACKEND_IMAGE} | ${BOT_IMAGE}"
echo "🌐 Backend:  http://localhost:3000"
echo "🌐 n8n:      http://localhost:5678"
echo "🌐 Frontend: https://nexoreal.xyz (Vercel)"

read -p "Push to DockerHub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker login -u ipproyectos
    docker push ${BACKEND_IMAGE}
    docker push ${BACKEND_IMAGE}:latest
    docker push ${BOT_IMAGE}
    docker push ${BOT_IMAGE}:latest
    echo "✅ Pushed to DockerHub"
fi
