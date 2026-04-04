# ============================================
# MLM Backend - Production Image
# ============================================
FROM node:24-alpine

WORKDIR /app

# Copy package file for production deps install
COPY package.json ./

# Install production dependencies only (no lockfile — it lives at monorepo root)
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --no-lockfile --prod

# Copy compiled dist from host
COPY dist/server.mjs ./dist/server.mjs

# Copy init script
COPY scripts/init-db.sh ./

# Setup non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["node", "dist/server.mjs", "--force-sync"]
