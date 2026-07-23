#!/usr/bin/env bash
# =============================================================================
# Nexo Real — Deploy Script (Azure / VPS)
# =============================================================================
# Generic deploy script: pulls Docker images, restarts containers, runs health checks.
# Works on any VPS with Docker installed (Azure, Hostinger, DonWeb, etc.)
#
# Usage:
#   ./deploy.sh [version]
#   ./deploy.sh v3.2.0
#   ./deploy.sh latest        (default)
#
# Prerequisites:
#   - Docker + Docker Compose installed (run provision.sh first)
#   - .env.azure configured in /opt/nexo-real/ (or current directory)
#   - Images pushed to Docker Hub (ipproyectos/mlm-backend, ipproyectos/mlm-bot)
# =============================================================================
set -euo pipefail

VERSION="${1:-latest}"
BACKEND_IMAGE="ipproyectos/mlm-backend:${VERSION}"
BOT_IMAGE="ipproyectos/mlm-bot:${VERSION}"
COMPOSE_FILE="docker-compose.azure.yml"
ENV_FILE=".env.azure"

# --- Colors -----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# --- Pre-flight checks -----------------------------------------------------
log "Nexo Real Deploy v${VERSION}"
echo ""

if [ ! -f "$COMPOSE_FILE" ]; then
    err "Compose file not found: $COMPOSE_FILE"
    err "Run this script from the directory containing $COMPOSE_FILE"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    err "Environment file not found: $ENV_FILE"
    err "Copy .env.azure.example to $ENV_FILE and fill in real values"
    exit 1
fi

if ! command -v docker &>/dev/null; then
    err "Docker not installed. Run provision.sh first."
    exit 1
fi

if ! docker info &>/dev/null 2>&1; then
    err "Docker daemon not running or current user lacks permissions."
    exit 1
fi

# --- Pull images ------------------------------------------------------------
log "Pulling images..."
docker pull "$BACKEND_IMAGE" 2>/dev/null && log "Pulled $BACKEND_IMAGE" || warn "Failed to pull $BACKEND_IMAGE (will use local)"
docker pull "$BOT_IMAGE" 2>/dev/null && log "Pulled $BOT_IMAGE" || warn "Failed to pull $BOT_IMAGE (will use local)"

# --- Restart containers -----------------------------------------------------
log "Restarting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

# --- Wait for health --------------------------------------------------------
log "Waiting for services to initialize..."
sleep 20

# --- Health checks ----------------------------------------------------------
check_health() {
    local name="$1"
    local url="$2"
    local code

    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$code" = "200" ]; then
        echo -e "  ${GREEN}✅${NC} ${name}: healthy (HTTP ${code})"
        return 0
    else
        echo -e "  ${RED}❌${NC} ${name}: unhealthy (HTTP ${code})"
        return 1
    fi
}

echo ""
log "Health checks:"
HEALTHY=0
TOTAL=2

check_health "Backend" "http://localhost:3000/api/health" && HEALTHY=$((HEALTHY + 1)) || true
check_health "Bot"     "http://localhost:3002/health"     && HEALTHY=$((HEALTHY + 1)) || true

echo ""
if [ "$HEALTHY" -eq "$TOTAL" ]; then
    log "All services healthy (${HEALTHY}/${TOTAL})"
else
    warn "Some services unhealthy (${HEALTHY}/${TOTAL})"
    echo ""
    echo "  Debug commands:"
    echo "    docker compose -f $COMPOSE_FILE logs --tail=50 backend"
    echo "    docker compose -f $COMPOSE_FILE logs --tail=50 bot"
    echo "    docker compose -f $COMPOSE_FILE ps"
fi

# --- Summary ----------------------------------------------------------------
echo ""
log "Deploy complete!"
echo "  Version:  ${VERSION}"
echo "  Backend:  ${BACKEND_IMAGE}"
echo "  Bot:      ${BOT_IMAGE}"
echo "  Compose:  ${COMPOSE_FILE}"
echo "  Env:      ${ENV_FILE}"
echo ""
echo "  Useful commands:"
echo "    docker compose -f $COMPOSE_FILE ps"
echo "    docker compose -f $COMPOSE_FILE logs -f"
echo "    docker compose -f $COMPOSE_FILE restart backend"
echo "    docker compose -f $COMPOSE_FILE restart bot"
