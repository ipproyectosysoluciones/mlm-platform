# Deployment Guide / Guía de Despliegue

> Complete guide for deploying the MLM Platform to production.
> Guía completa para desplegar la MLM Platform a producción.

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

| Service  | URL                                                     | Purpose                |
| -------- | ------------------------------------------------------- | ---------------------- |
| Frontend | https://mlm-platform-ip-proyectosysoluciones.vercel.app | Production (principal) |
| Backend  | https://backend.lordastaroth77.cloudflareaccess.com     | API Backend            |
| Docker   | https://hub.docker.com/r/ipproyectos/mlm-backend        | Container Registry     |

> **Note**: Backup/internal URL: `https://frontend-beta-rosy-89.vercel.app`

---

## 🚀 Quick Deploy / Despliegue Rápido

### Backend (Docker)

```bash
# Pull latest
docker pull ipproyectos/mlm-backend:latest

# Run with Docker Compose
docker compose -f docker-compose.prod.yml up -d backend
```

### Frontend (Vercel)

Automatic deployment via GitHub Actions when pushing to `release` branch.

---

### Using Deploy Script / Usando Script de Deploy

```bash
# Make executable
chmod +x deploy-backend.sh

# Deploy backend only
./deploy-backend.sh latest

# Deploy specific version
./deploy-backend.sh v1.7.2
```

---

### Using Docker Compose (Recommended) / Usando Docker Compose (Recomendado)

```bash
# Clone repository
git clone https://github.com/ipproyectosysoluciones/mlm-platform.git
cd mlm-platform

# Create production environment file
cp .env.example .env.production
# Edit .env.production with your values

# Start all services
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check status
docker compose -f docker-compose.prod.yml ps
```

### Using Deploy Script

```bash
# Make executable
chmod +x deploy.sh

# Deploy latest version
./deploy.sh latest

# Deploy specific version
./deploy.sh v1.3.0
```

---

## 🐳 Docker Images (Backend Only)

### Pre-built Images (Docker Hub)

```bash
# Pull backend image
docker pull ipproyectos/mlm-backend:latest

# Run backend
docker run -d \
  --name mlm-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=postgres \
  -e DB_NAME=mlm_db \
  -e DB_USER=mlm \
  -e DB_PASSWORD=secret \
  -e JWT_SECRET=your-secret \
  ipproyectos/mlm-backend:latest
```

> **Note**: Frontend is deployed via Vercel, not Docker. / El frontend se despliega vía Vercel, no Docker.

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
BREVO_FROM_NAME=MLM Platform

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
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set up rate limiting
- [ ] Configure firewall rules
- [ ] Enable database backups
- [ ] Set up monitoring (Sentry)
- [ ] Review CORS settings
- [ ] Update email credentials

### Recommended Security Headers

Add to your reverse proxy (nginx):

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Remove server header
server_tokens off;
```

---

## 🌐 Nginx Configuration

### Production Config

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Frontend static files
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support (if needed)
    location /ws {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🔄 CI/CD Deployment

### GitHub Actions Pipeline

The project includes automatic deployment via GitHub Actions:

1. **Push to `development`**: Runs CI tests
2. **Push to `main`**: Runs CI tests
3. **Push to `release`**: Builds and deploys to Docker Hub

### Manual Deployment Steps

```bash
# 1. Update version
git tag v1.3.0
git push origin v1.3.0

# 2. CI/CD automatically:
#    - Runs tests
#    - Builds Docker images
#    - Pushes to Docker Hub

# 3. On server, pull new images
docker pull ipproyectos/mlm-backend:v1.3.0
docker pull ipproyectos/mlm-frontend:v1.3.0

# 4. Restart services
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 📊 Monitoring

### Health Checks

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Check API health
curl http://localhost:3001/api/health

# Check logs
docker logs mlm-backend-1 --tail 100
```

### Sentry Integration

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
lsof -i :80

# Restart services
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Useful Commands

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Rebuild without cache
docker build --no-cache -t image:tag .

# Clean up unused images
docker image prune -f

# Shell into container
docker exec -it mlm-backend-1 sh
```

---

## 📋 Docker Compose Production Template

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-mlm_db}
      POSTGRES_USER: ${DB_USER:-mlm}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER:-mlm}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    image: ipproyectos/mlm-backend:latest
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
      SENTRY_DSN: ${SENTRY_DSN}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    image: ipproyectos/mlm-frontend:latest
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

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
