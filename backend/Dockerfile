# ============================================
# MLM Backend Docker Image
# Multi-stage build for optimized production image
# ============================================

# -----------------------------------------------------------------------------
# Builder Stage - Compile TypeScript
# -----------------------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first (for better Docker cache)
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install dependencies (including dev for build tools)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend/tsconfig.json ./
COPY backend/scripts ./scripts
COPY backend/src ./src

# Build the application
RUN pnpm --filter mlm-backend build

# -----------------------------------------------------------------------------
# Production Stage - Minimal runtime image
# -----------------------------------------------------------------------------
FROM node:24-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling (PID 1)
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install production dependencies only (no devDependencies)
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Use dumb-init as PID 1 for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "dist/server.cjs"]
