# ============================================
# MLM Backend - Production Image
# ============================================
# Multi-stage: solo copia dist/ compilado localmente
FROM node:24-alpine

WORKDIR /app

# Copy package files for production deps only
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --no-frozen-lockfile --prod

# Copy compiled dist from host (compiled during deploy.sh)
COPY backend/dist ./dist

# Setup non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
