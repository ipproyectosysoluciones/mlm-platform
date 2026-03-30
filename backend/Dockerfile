# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy all backend files
COPY backend/package.json backend/pnpm-lock.yaml backend/tsconfig.json ./
COPY backend/scripts ./scripts
COPY backend/src ./src

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Build with esbuild
RUN node scripts/build.mjs

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.cjs"]
