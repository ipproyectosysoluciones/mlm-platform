# ============================================
# MLM Backend - Production Image
# ============================================
FROM node:24-alpine

WORKDIR /app

# Copy package file — lockfile lives at monorepo root and is incompatible with
# --frozen-lockfile here (root overrides don't match backend package.json).
# pnpm install --prod with pinned versions in package.json is deterministic enough.
COPY package.json ./

# Install production dependencies (pinned pnpm, prod-only, no dev deps)
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate && \
    pnpm install --prod --no-lockfile

# Copy compiled dist from host
COPY dist/server.mjs ./dist/server.mjs

# Setup non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# --alter: applies schema changes without dropping tables (safe for production data)
# Use --force-sync ONLY in dev/test environments — it DROPS ALL TABLES on every start
ENTRYPOINT ["node", "dist/server.mjs", "--alter"]
