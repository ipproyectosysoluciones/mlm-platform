#!/usr/bin/env bash
# =============================================================================
# update-tunnel-url.sh
# Updates the trycloudflare tunnel URL across all config files and pushes.
#
# Usage:
#   ./update-tunnel-url.sh https://something-random.trycloudflare.com
# =============================================================================

set -euo pipefail

# ── Validate argument ─────────────────────────────────────────────────────────
if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <tunnel-url>"
  echo "Example: $0 https://something-random.trycloudflare.com"
  exit 1
fi

NEW_URL="${1%/}"  # strip trailing slash if any

if [[ ! "$NEW_URL" =~ ^https://.*\.trycloudflare\.com$ ]]; then
  echo "ERROR: URL must be a valid trycloudflare.com HTTPS URL"
  echo "Example: https://something-random.trycloudflare.com"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.production"
VERCEL_JSON="$SCRIPT_DIR/frontend/vercel.json"
FRONTEND_URL="https://mlm-platform-ip-proyectosysoluciones.vercel.app"

echo ""
echo "🔄  Updating tunnel URL to: $NEW_URL"
echo ""

# ── 1. Update .env.production ─────────────────────────────────────────────────
echo "📝  Updating .env.production..."

sed -i "s|^APP_URL=.*|APP_URL=$NEW_URL|" "$ENV_FILE"
sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$FRONTEND_URL,$NEW_URL|" "$ENV_FILE"

echo "    APP_URL=$NEW_URL"
echo "    ALLOWED_ORIGINS=$FRONTEND_URL,$NEW_URL"

# ── 2. Update frontend/vercel.json ────────────────────────────────────────────
echo "📝  Updating frontend/vercel.json..."

# Replace any https://*.trycloudflare.com/api/$1 destination
sed -i "s|https://[a-z0-9-]*\.trycloudflare\.com/api/\$1|$NEW_URL/api/\$1|g" "$VERCEL_JSON"

echo "    Rewrite destination → $NEW_URL/api/\$1"

# ── 3. Restart backend container with new env ─────────────────────────────────
echo ""
echo "🐳  Restarting backend container..."
docker compose -f "$SCRIPT_DIR/docker-compose.prod.yml" --env-file "$ENV_FILE" up -d backend
echo "    Backend restarted with new APP_URL"

# ── 4. Commit & push ──────────────────────────────────────────────────────────
echo ""
echo "🚀  Committing and pushing..."

cd "$SCRIPT_DIR"
git add frontend/vercel.json
git commit --no-gpg-sign -m "fix(tunnel): update trycloudflare URL to ${NEW_URL##*/}"
git push origin release

echo ""
echo "✅  Done! Vercel will redeploy automatically in ~1 minute."
echo ""
echo "    Frontend : $FRONTEND_URL"
echo "    Backend  : $NEW_URL"
echo "    Health   : $NEW_URL/api/health"
echo ""
