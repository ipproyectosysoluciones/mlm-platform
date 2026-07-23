#!/usr/bin/env bash
# =============================================================================
# Nexo Real — Rollback Script
# =============================================================================
# Generic rollback: pulls a previous version and restarts containers.
# Works on any VPS with Docker Compose installed.
#
# Usage:
#   ./rollback.sh v3.1.0        # rollback to specific version
#   ./rollback.sh latest        # rollback to latest tag
#   ./rollback.sh --list        # list recent Docker Hub tags
#
# Environment variables:
#   COMPOSE_FILE   — compose file (default: docker-compose.azure.yml)
#   ENV_FILE       — env file (default: .env.azure)
# =============================================================================
set -euo pipefail

VERSION="${1:-}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.azure.yml}"
ENV_FILE="${ENV_FILE:-.env.azure}"
BACKEND_IMAGE="ipproyectos/mlm-backend"
BOT_IMAGE="ipproyectos/mlm-bot"

# --- Colors -----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[ROLLBACK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# --- Help -------------------------------------------------------------------
usage() {
  cat <<EOF
Nexo Real — Rollback Script

Usage:
  $0 <version>          Rollback to a specific version tag
  $0 --list             List recent Docker Hub tags for backend image
  $0 --help             Show this help

Examples:
  $0 v3.1.0
  $0 latest
  $0 --list
EOF
  exit 0
}

# --- List mode ---------------------------------------------------------------
if [ "$VERSION" = "--list" ] || [ "$VERSION" = "-l" ]; then
  log "Recent tags for ${BACKEND_IMAGE}:"
  echo ""
  # Requires curl + jq; show available tags from Docker Hub API
  if command -v curl &>/dev/null && command -v jq &>/dev/null; then
    TAGS=$(curl -s "https://hub.docker.com/v2/repositories/${BACKEND_IMAGE}/tags/?page_size=10&ordering=last_updated" \
      | jq -r '.results[].name' 2>/dev/null || echo "Failed to fetch tags")
    echo "$TAGS"
  else
    warn "curl or jq not installed. Install them to list Docker Hub tags."
    warn "Or check manually: https://hub.docker.com/r/${BACKEND_IMAGE}/tags"
  fi
  exit 0
fi

# --- Validate ----------------------------------------------------------------
if [ -z "$VERSION" ]; then
  err "No version specified."
  echo ""
  usage
fi

if [ "$VERSION" = "--help" ] || [ "$VERSION" = "-h" ]; then
  usage
fi

# --- Pre-flight checks ------------------------------------------------------
if [ ! -f "$COMPOSE_FILE" ]; then
  err "Compose file not found: $COMPOSE_FILE"
  err "Run this script from the directory containing $COMPOSE_FILE"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  err "Environment file not found: $ENV_FILE"
  exit 1
fi

if ! command -v docker &>/dev/null; then
  err "Docker not installed."
  exit 1
fi

# --- Record current state ---------------------------------------------------
log "Recording current state..."
CURRENT_BACKEND=$(docker inspect --format='{{.Config.Image}}' mlm-backend 2>/dev/null || echo "unknown")
CURRENT_BOT=$(docker inspect --format='{{.Config.Image}}' mlm-bot 2>/dev/null || echo "unknown")
log "  Current backend image: ${CURRENT_BACKEND}"
log "  Current bot image:     ${CURRENT_BOT}"
echo ""

# --- Pull old versions ------------------------------------------------------
log "Rolling back to version: ${VERSION}"
echo ""

BACKEND_TAG="${BACKEND_IMAGE}:${VERSION}"
BOT_TAG="${BOT_IMAGE}:${VERSION}"

log "Pulling ${BACKEND_TAG}..."
if docker pull "$BACKEND_TAG" 2>/dev/null; then
  log "Pulled ${BACKEND_TAG}"
else
  err "Failed to pull ${BACKEND_TAG}. Check that the tag exists."
  echo ""
  echo "  Run '$0 --list' to see available tags."
  exit 1
fi

log "Pulling ${BOT_TAG}..."
if docker pull "$BOT_TAG" 2>/dev/null; then
  log "Pulled ${BOT_TAG}"
else
  warn "Failed to pull ${BOT_TAG}. Will use current bot image."
fi

# --- Restart containers -----------------------------------------------------
log "Restarting services with version ${VERSION}..."
VERSION="$VERSION" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

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
check_health "Bot"     "http://localhost:3002/"           && HEALTHY=$((HEALTHY + 1)) || true

# --- Summary ----------------------------------------------------------------
echo ""
if [ "$HEALTHY" -eq "$TOTAL" ]; then
  log "Rollback complete — all services healthy (${HEALTHY}/${TOTAL})"
else
  warn "Rollback done but some services unhealthy (${HEALTHY}/${TOTAL})"
  echo ""
  echo "  Debug commands:"
  echo "    docker compose -f $COMPOSE_FILE logs --tail=50 backend"
  echo "    docker compose -f $COMPOSE_FILE logs --tail=50 bot"
  echo "    docker compose -f $COMPOSE_FILE ps"
fi

echo ""
echo "  Rollback details:"
echo "    Previous:  backend=${CURRENT_BACKEND}  bot=${CURRENT_BOT}"
echo "    Current:   backend=${BACKEND_TAG}  bot=${BOT_TAG}"
echo ""
echo "  To rollback again: $0 <version>"
echo "  To revert forward: $0 latest"
