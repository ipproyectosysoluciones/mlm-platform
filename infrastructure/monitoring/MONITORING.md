# ============================================

# Nexo Real — Monitoring Guide

# ============================================

# Quick reference for monitoring setup

## Overview

Monitoring stack (lightweight, ~10MB RAM):

- **Dozzle** — Real-time Docker log viewer (port 8080)
- **Healthcheck script** — Automated checks every 5 minutes
- **Alerts** — Telegram + Email (Brevo) on failures

---

## Dozzle — Log Viewer

### What is it?

Dozzle is a real-time log viewer for Docker containers. Think of it as `docker logs -f` but in a web UI with search, filters, and multiple container views.

### Access

- **Local**: http://localhost:8080
- **No authentication needed** (local network only — do NOT expose publicly)

### How to use

1. Open http://localhost:8080 in your browser
2. Left panel shows all running containers
3. Click a container to see its logs in real-time
4. Use the search bar to filter logs
5. Use the "Live" toggle to pause/resume auto-scroll

### Useful features

- **Search**: Type in the search bar to filter logs (regex supported)
- **Container groups**: Containers are grouped by Docker Compose project
- **Timestamps**: Toggle timestamp display with the clock icon
- **Dark mode**: Click the moon icon in the top right
- **Download**: Click the download icon to save logs to a file

### Common commands

```bash
# Check Dozzle is running
docker ps | grep dozzle

# Restart Dozzle
docker restart dozzle

# View Dozzle logs
docker logs dozzle --tail 50

# Stop Dozzle
docker stop dozzle
```

---

## Healthcheck Script

### What it checks

Every 5 minutes, the script verifies:

1. **Containers**: All 5 Docker containers are running
2. **Endpoints**: Backend health API responds (local + external)
3. **Disk**: Usage on /mnt/docker-data
4. **Memory**: System RAM usage

### Alert thresholds

| Metric | Warning | Critical |
| ------ | ------- | -------- |
| Disk   | 80%     | 90%      |
| Memory | 85%     | —        |

### When alerts fire

- **CRITICAL**: Container down, endpoint unreachable, or disk >90%
- **WARNING**: Disk >80% or memory >85%
- **RECOVERY**: System was failing, now all checks pass

### Manual run

```bash
# Run healthcheck manually
/media/bladimir/Datos2/Datos/MLM/infrastructure/monitoring/healthcheck.sh

# Check the log
tail -20 /var/log/mlm-healthcheck.log
```

### Configuration

Edit `.env.monitoring` in the same directory:

```bash
nano /media/bladimir/Datos2/Datos/MLM/infrastructure/monitoring/.env.monitoring
```

### Cron schedule

```bash
# View current cron jobs
crontab -l

# Edit cron jobs
crontab -e

# Current schedule: every 5 minutes
*/5 * * * * /path/to/healthcheck.sh >> /var/log/mlm-healthcheck.log 2>&1
```

---

## Quick Troubleshooting

### "Container not found" alerts

```bash
# Check container status
docker ps -a

# Restart specific container
docker compose -f docker-compose.prod.yml --env-file .env.production up -d <container_name>

# Check container logs
docker logs <container_name> --tail 50
```

### "Health endpoint failed" alerts

```bash
# Test local endpoint
curl http://localhost:3000/api/v1/health

# Test external endpoint
curl https://api.nexoreal.xyz/api/v1/health

# If local works but external doesn't → Cloudflare Tunnel issue
systemctl status cloudflared
```

### "Disk usage high" alerts

```bash
# Check disk usage
df -h /mnt/docker-data

# Clean Docker images
docker system prune -a

# Clean build cache
docker builder prune -a
```

### "Memory usage high" alerts

```bash
# Check what's using memory
docker stats --no-stream

# Check system memory
free -h
```

---

## Service Management

### Start all monitoring

```bash
# Dozzle is auto-started (unless-stopped)
docker start dozzle

# Healthcheck runs via cron (auto-starts)
```

### Stop all monitoring

```bash
# Stop Dozzle
docker stop dozzle

# Disable healthcheck cron
crontab -e  # Comment out or remove the healthcheck line
```

### View monitoring status

```bash
# Dozzle status
docker ps | grep dozzle

# Cron status
crontab -l | grep healthcheck

# Recent healthcheck logs
tail -20 /var/log/mlm-healthcheck.log
```

---

## Files Reference

```
infrastructure/monitoring/
├── .env.monitoring        # Secrets (Telegram token, Brevo API key)
├── healthcheck.sh         # Main healthcheck script
└── MONITORING.md          # This file
```
