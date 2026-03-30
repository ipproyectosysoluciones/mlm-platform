# ============================================
# MLM Frontend Docker Image
# Multi-stage build with Nginx for static assets
# ============================================

# -----------------------------------------------------------------------------
# Builder Stage - Build React/Vite app
# -----------------------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first (for better Docker cache)
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install all dependencies (including dev for Vite/build tools)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY frontend/vite.config.ts ./
COPY frontend/tsconfig.json ./
COPY frontend/index.html ./
COPY frontend/public ./public
COPY frontend/src ./src

# Build the application
RUN pnpm --filter frontend build

# -----------------------------------------------------------------------------
# Production Stage - Nginx serving static files
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
