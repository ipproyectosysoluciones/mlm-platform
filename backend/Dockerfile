# ============================================
# Nexo Real Backend — Multi-stage Production Image
# Stage 1: builder — compiles TypeScript → ESM via esbuild
# Stage 2: runtime — minimal Alpine image, no dev deps, no source code
# ============================================

# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files needed for dependency install and build
COPY package.json ./

# Enable pnpm via corepack (pinned version — reproducible)
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install ALL deps (including devDependencies — needed for esbuild and typescript)
RUN pnpm install --no-lockfile

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY tsconfig.json ./

# Run esbuild — outputs dist/server.mjs (minified, legalComments: none)
RUN NODE_ENV=production node scripts/build.mjs

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

WORKDIR /app

# Copy only the package.json for production dependency install
COPY package.json ./

# Enable pnpm and install production dependencies only
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate && \
    pnpm install --prod --no-lockfile

# Copy compiled bundle from builder stage — no source, no dev tools
COPY --from=builder /app/dist/server.mjs ./dist/server.mjs

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
