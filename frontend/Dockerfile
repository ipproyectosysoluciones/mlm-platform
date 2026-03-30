# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files from frontend subdirectory
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --no-lockfile --include=dev

# Copy source (from frontend/ subdirectory)
COPY frontend/ .

# Build for production
RUN pnpm build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy custom nginx config (from frontend/ subdirectory)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
