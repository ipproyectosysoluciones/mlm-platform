# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-slim AS builder

# git is required by baileys@7.x which has a GitHub-hosted dependency (libsignal-node)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.33.0

WORKDIR /app

# pnpm-lock.yaml lives at monorepo root — not available in ./bot context.
# Use --no-frozen-lockfile for Docker builds.
COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/

RUN pnpm build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-slim AS production

# Required by Baileys (Chromium/canvas native deps) + git for libsignal-node GitHub dep
RUN apt-get update && apt-get install -y \
    git \
    libgbm-dev \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libglib2.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.33.0

WORKDIR /app

COPY package.json ./
RUN pnpm install --no-frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

# bot_sessions/ is mounted as a Docker volume to persist WhatsApp session
# If this directory disappears, the bot needs to re-pair via pairing code
RUN mkdir -p /app/bot_sessions

# prompt_kb/ is mounted at runtime via docker-compose volume (never baked into image)
RUN mkdir -p /app/prompt_kb

ENV NODE_ENV=production

EXPOSE 3002

# SYS_ADMIN cap is required at container level (set in docker-compose, not here)
CMD ["node", "dist/app.js"]
