# Deployment Guide / Guía de Despliegue

> Complete guide for deploying the Nexo Real platform to production.
> Guía completa para desplegar la plataforma Nexo Real a producción.

## 🏗️ Architecture / Arquitectura

The platform uses a **hybrid deployment model**:

| Component    | Deployment | Platform                       |
| ------------ | ---------- | ------------------------------ |
| **Backend**  | Docker     | Docker Hub + Cloudflare Tunnel |
| **Frontend** | Vercel     | Vercel (automatic CDN)         |

### Benefits / Beneficios

- **Backend**: Full control, self-hosted, runs via Cloudflare Tunnel
- **Frontend**: Global CDN, edge caching, automatic SSL

---

## 🔗 Production URLs / URLs de Producción

| Service    | URL                                              | Purpose                           |
| ---------- | ------------------------------------------------ | --------------------------------- |
| Frontend   | https://nexoreal.xyz                             | Production (principal)            |
| Backend    | https://api.nexoreal.xyz                         | API Backend                       |
| n8n        | https://n8n.nexoreal.xyz                         | n8n (Cloudflare Access protected) |
| Bot        | https://bot.nexoreal.xyz                         | Nexo Bot                          |
| Docker Hub | https://hub.docker.com/r/ipproyectos/mlm-backend | Container Registry                |

> **Note**: Backup/internal URL: `https://frontend-beta-rosy-89.vercel.app`

---

## 🚀 Quick Deploy / Despliegue Rápido

### Backend (Docker)

```bash
# Pull latest
docker pull ipproyectos/mlm-backend:release

# Run with Docker Compose (env file is REQUIRED — not auto-loaded)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Frontend (Vercel)

Automatic deployment via Vercel on push to `release` branch.

---

### Using Docker Compose (Recommended) / Usando Docker Compose (Recomendado)

```bash
# Clone repository
git clone https://github.com/ipproyectosysoluciones/mlm-platform.git
cd nexo-real

# Create production environment file
cp .env.example .env.production
# Edit .env.production with your values

# Start all services (env file is REQUIRED)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check status
docker compose -f docker-compose.prod.yml ps
```

---

## 🐳 Docker Images

### Pre-built Images (Docker Hub)

```bash
# Pull backend image
docker pull ipproyectos/mlm-backend:release

# Pull bot image
docker pull ipproyectos/mlm-bot:release
```

### Production Containers

| Container        | Port      | Purpose                                      |
| ---------------- | --------- | -------------------------------------------- |
| `mlm-backend-1`  | 3000      | API Backend (healthcheck: `/api/v1/health`)  |
| `mlm-bot-1`      | 3002      | Nexo Bot (WhatsApp)                          |
| `mlm-postgres-1` | 5432/5434 | PostgreSQL 16 (DB: `mlm_db`, user: `mlm`)    |
| `mlm-redis-1`    | 6379      | Redis 7                                      |
| `mlm-n8n-1`      | 5678      | n8n Automation (Cloudflare Access protected) |
| `dozzle`         | 8080      | Real-time Docker log viewer                  |

---

## ⚙️ Environment Variables

### Backend (.env)

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DB_DIALECT=postgres
DB_HOST=postgres
DB_PORT=5432
DB_NAME=mlm_db
DB_USER=mlm
DB_PASSWORD=your-secure-password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-very-long-and-secure-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (Brevo/Sendinblue)
BREVO_API_KEY=your-brevo-api-key
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_FROM_NAME=Nexo Real

# Monitoring
SENTRY_DSN=https://example@sentry.io/project
SENTRY_ENVIRONMENT=production

# Frontend URL (for emails)
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Frontend (.env.production)

```env
VITE_API_URL=/api
VITE_APP_URL=https://yourdomain.com
```

---

## 🗄️ Database Setup

### PostgreSQL with Docker

```bash
# Create database container
docker run -d \
  --name mlm-postgres \
  -e POSTGRES_DB=mlm_db \
  -e POSTGRES_USER=mlm \
  -e POSTGRES_PASSWORD=your-secure-password \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Initialize database (auto-synced on backend start)
# The backend will automatically create tables on first run
```

### Database Migrations

The backend automatically syncs the database schema on startup. For manual control:

```bash
# Sync database (non-destructive)
docker exec mlm-backend-1 node dist/server.cjs

# Force sync (drops tables first - DANGEROUS)
docker exec mlm-backend-1 node dist/server.cjs --force-sync
```

---

## 🛡️ Security Checklist

### Before Going Live

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Configure ALLOWED_ORIGINS with your domain
- [ ] Verify Cloudflare Tunnel is running and routes are correct
- [ ] Set up Cloudflare Access on n8n.nexoreal.xyz
- [ ] Enable database backups
- [ ] Verify monitoring (Dozzle, healthcheck, Telegram alerts)
- [ ] Review CORS settings
- [ ] Update email credentials
- [ ] Ensure .env.production is NOT committed to git

### Recommended Security Headers

Cloudflare handles most security headers automatically. For additional hardening:

- X-Frame-Options and X-Content-Type-Options are set by Cloudflare
- HSTS is managed at the Cloudflare zone level
- DDoS protection is automatic with Cloudflare

---

## 🌐 Reverse Proxy — Cloudflare Tunnel

The platform uses **Cloudflare Tunnel** instead of a traditional reverse proxy. No nginx or open firewall ports needed.

- Tunnel name: `nexo-real-backend`
- Protocol: `http2` (required for Vivaldi VPN compatibility)
- Host: Astaroth (190.9.193.112)
- Docker Engine storage: `/mnt/docker-data` on `/dev/sda4` (30GB)

Cloudflare handles SSL termination, DDoS protection, and global routing.

---

## 🔄 CI/CD Deployment

### GitHub Actions Pipeline

The project uses **Docker Hub CI/CD** (not Azure):

1. **Push to `development`**: Runs CI tests + type check gate
2. **Push to `release`**: Builds and pushes Docker images to Docker Hub
3. **Tag pushed**: Creates GitHub Release

### CD Workflows

| Workflow         | Image                     | Docker Hub                         |
| ---------------- | ------------------------- | ---------------------------------- |
| `cd-backend.yml` | `ipproyectos/mlm-backend` | Pushes `latest` and `release` tags |
| `cd-bot.yml`     | `ipproyectos/mlm-bot`     | Pushes `latest` and `release` tags |

### Manual Deployment Steps

```bash
# 1. On server, pull new images
docker pull ipproyectos/mlm-backend:release
docker pull ipproyectos/mlm-bot:release

# 2. Restart services (env file REQUIRED)
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## 📊 Monitoring

### Dozzle (Real-time Logs)

Dozzle runs on port 8080 for live Docker log streaming across all containers.

### Health Checks

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Check API health
curl http://localhost:3000/api/v1/health

# Run healthcheck manually
bash infrastructure/monitoring/healthcheck.sh

# Cron: runs every 5 minutes for continuous monitoring
```

### Cloudflare Tunnel

The platform is exposed via Cloudflare Tunnel (no open ports needed):

| Route              | Internal Service                       |
| ------------------ | -------------------------------------- |
| `api.nexoreal.xyz` | backend:3000                           |
| `n8n.nexoreal.xyz` | n8n:5678 (Cloudflare Access protected) |
| `bot.nexoreal.xyz` | bot:3002                               |

**Tunnel name**: `nexo-real-backend` (ID: `5daa75c9-45f5-4648-a34a-bb334a299693`)

### Telegram Alerts

Monitoring alerts are sent via the `@IP_Proyectos_y_Soluciones_bot` Telegram bot.

### Sentry Integration (Optional)

1. Create project at [sentry.io](https://sentry.io)
2. Get DSN URL
3. Set `SENTRY_DSN` environment variable
4. Errors will be automatically tracked

---

## 🔧 Troubleshooting

### Common Issues

**Database connection failed**

```bash
# Check if postgres is running
docker ps | grep postgres

# Check logs
docker logs mlm-postgres-1

# Verify credentials
docker exec mlm-postgres-1 psql -U mlm -d mlm_db -c "SELECT 1"
```

**Frontend 500 errors**

```bash
# Check backend logs
docker logs mlm-backend-1

# Verify CORS settings in .env.production
```

**Service won't start**

```bash
# Check port conflicts
lsof -i :3000
lsof -i :8080

# Restart services (env file REQUIRED)
docker compose -f docker-compose.prod.yml --env-file .env.production down
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Useful Commands

```bash
# View all logs (with env file)
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f

# View logs in Dozzle
# Open http://localhost:8080 in browser

# Restart specific service
docker compose -f docker-compose.prod.yml --env-file .env.production restart backend

# Clean up unused images
docker image prune -f

# Shell into container
docker exec -it mlm-backend-1 sh

# Run healthcheck manually
bash infrastructure/monitoring/healthcheck.sh
```

---

## 📋 Docker Compose Production Template

```yaml
# Requires: --env-file .env.production

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-mlm_db}
      POSTGRES_USER: ${DB_USER:-mlm}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER:-mlm}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'

  backend:
    image: ipproyectos/mlm-backend:release
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ['CMD-SHELL', 'curl -f http://localhost:3000/api/v1/health || exit 1']
      interval: 30s
      timeout: 5s
      retries: 3
    ports:
      - '3000:3000'

  bot:
    image: ipproyectos/mlm-bot:release
    depends_on:
      - backend
    ports:
      - '3002:3002'

  n8n:
    image: n8nio/n8n
    depends_on:
      - backend
    ports:
      - '5678:5678'

volumes:
  postgres_data:
  redis_data:
```

> **Important**: Always run with `--env-file .env.production`. Docker Compose does NOT auto-load environment files.

---

## 🌊 Scaling

### Horizontal Scaling

For high traffic, scale the backend:

```bash
# Scale backend to 3 instances
docker compose -f docker-compose.prod.yml up -d --scale backend=3

# Note: Requires load balancer for backend:3000
```

### Database Scaling

For production databases, consider:

- Managed PostgreSQL (AWS RDS, Supabase, Neon)
- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)

---

## 📞 Support

For deployment issues:

- Check [Troubleshooting](#-troubleshooting) section
- Review [Architecture docs](ARCHITECTURE.md)
- Open an issue on GitHub
