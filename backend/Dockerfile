# ============================================
# MLM Backend - Production Image
# ============================================
# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile
COPY backend/ ./
RUN pnpm build

# Stage 2: Production
FROM node:24-alpine
WORKDIR /app
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
CMD ["node", "dist/server.cjs"]
