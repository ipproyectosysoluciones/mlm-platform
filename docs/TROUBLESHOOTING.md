# Troubleshooting — Azure VM Infrastructure

Common issues and fixes for the Nexo Real Azure deployment.

---

## SSH Connection Issues

### "Permission denied (publickey)"

**Cause**: SSH key not matching or not configured on the VM.

**Fix**:

```bash
# Verify your key
ssh -i ~/.ssh/nexoreal_deploy -o StrictHostKeyChecking=no azureuser@<YOUR_VM_IP>

# If still failing, check the VM's authorized_keys
ssh -i ~/.ssh/nexoreal_deploy azureuser@<YOUR_VM_IP> "cat ~/.ssh/authorized_keys"
```

If the VM was reprovisioned, re-upload your public key:

```bash
# On Azure Portal → VM → Reset SSH public key
# Or from local:
ssh-copy-id -i ~/.ssh/nexoreal_deploy.pub azureuser@<YOUR_VM_IP>
```

### "Connection timed out"

**Cause**: NSG is blocking your IP, or VM is stopped.

**Fix**:

1. Check VM status in Azure Portal
2. Check NSG rules — your IP must be in `allowed_ssh_ips`
3. Get your current IP: `curl ifconfig.me`
4. Update `terraform.tfvars` and re-apply if needed:
   ```bash
   cd infrastructure/terraform
   # Edit terraform.tfvars — add your current IP
   terraform apply -var-file=terraform.tfvars
   ```

---

## Docker Container Not Starting

### Check container status

```bash
docker compose -f docker-compose.azure.yml ps
```

If a container shows `Exit` or `Restarting`:

### View logs

```bash
# Backend logs
docker compose -f docker-compose.azure.yml logs --tail=100 backend

# Bot logs
docker compose -f docker-compose.azure.yml logs --tail=100 bot
```

### Common causes

| Symptom                | Cause                                | Fix                                       |
| ---------------------- | ------------------------------------ | ----------------------------------------- |
| `Exit 1` immediately   | Missing `.env.azure` or bad env vars | Check `docker compose config` for errors  |
| `Restarting` loop      | App crash on startup                 | Check logs for error message              |
| `OOMKilled`            | Out of memory                        | Check `free -m` — add swap or upgrade VM  |
| `Cannot connect to DB` | Wrong `DB_HOST` or firewall blocking | Verify `DB_HOST` matches Terraform output |

### Force restart

```bash
docker compose -f docker-compose.azure.yml down
docker compose -f docker-compose.azure.yml up -d
```

### Rebuild from scratch

```bash
docker compose -f docker-compose.azure.yml down --remove-orphans
docker system prune -f
docker compose -f docker-compose.azure.yml --env-file .env.azure up -d
```

---

## Nginx 502 Bad Gateway

**Cause**: Nginx can't reach the backend or bot container.

### Diagnosis

```bash
# Test backend directly
curl -s http://localhost:3000/api/health

# Test bot directly
curl -s http://localhost:3002/

# Test through Nginx
curl -s http://localhost/

# Check Nginx error log
sudo tail -50 /var/log/nginx/nexoreal-error.log
```

### Common fixes

1. **Container not running**:

   ```bash
   docker compose -f docker-compose.azure.yml ps
   # If stopped: docker compose up -d
   ```

2. **Port mismatch**: Nginx proxies to `127.0.0.1:3000` but backend is on another port:

   ```bash
   docker compose -f docker-compose.azure.yml port backend 3000
   # Should show: 127.0.0.1:3000
   ```

3. **Nginx config syntax error**:

   ```bash
   sudo nginx -t
   # If error: fix the config, then
   sudo systemctl reload nginx
   ```

4. **Nginx not running**:
   ```bash
   sudo systemctl status nginx
   sudo systemctl start nginx
   ```

---

## Cloudflare Tunnel Not Connecting

### Check tunnel status

```bash
sudo systemctl status cloudflared
```

If `inactive` or `failed`:

```bash
# View logs
sudo journalctl -u cloudflared --no-pager -n 50

# Restart
sudo systemctl restart cloudflared
```

### Common causes

| Symptom              | Cause                        | Fix                                       |
| -------------------- | ---------------------------- | ----------------------------------------- |
| `failed to dial`     | Tunnel token invalid         | Re-generate token in Cloudflare dashboard |
| `connection refused` | Nginx not running on port 80 | `sudo systemctl start nginx`              |
| `error="x509"`       | Certificate issue            | Tunnel token handles certs — re-install   |
| DNS not resolving    | CNAME not configured         | Add DNS records in Cloudflare dashboard   |

### Verify tunnel config

```bash
sudo cat /etc/cloudflared/config.yml
```

Should contain:

```yaml
ingress:
  - hostname: nexoreal.xyz
    service: http://localhost:80
  - hostname: www.nexoreal.xyz
    service: http://localhost:80
  - service: http_status:404
```

### Reinstall tunnel

```bash
sudo cloudflared service install <YOUR_TUNNEL_TOKEN>
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## PostgreSQL Connection Refused

### Test connection from VM

```bash
# Install psql if not present
sudo apt install postgresql-client

# Test connection (replace with your values)
psql "postgresql://mlm_admin:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5432/mlm_db?sslmode=require"
```

### Common causes

1. **Firewall blocking**: Azure PostgreSQL only allows specific IPs
   - VM IP must be in the firewall rules (Terraform creates this automatically)
   - Check in Azure Portal → PostgreSQL → Networking

2. **Wrong `DB_HOST`**: Must be the FQDN from Terraform output, not an IP

   ```bash
   # Correct format:
   DB_HOST=nexoreal-db.postgres.database.azure.com

   # Wrong:
   DB_HOST=10.0.1.4  (private IP won't work)
   ```

3. **SSL required**: Azure PostgreSQL requires `sslmode=require`

   ```
   DATABASE_URL=postgresql://...?sslmode=require
   ```

4. **Password changed**: If you changed the DB password in Terraform, update `.env.azure` too

### Check PostgreSQL server status

In Azure Portal → Database for PostgreSQL Flexible Server → Overview:

- Status should be **Running**
- Check compute size (B1MS = 1 vCPU, 2 GB)

---

## Health Check Failures

### Backend health check fails

```bash
# Direct test
curl -v http://localhost:3000/api/health

# Check backend logs
docker compose -f docker-compose.azure.yml logs --tail=50 backend
```

**Common issues**:

- App crash on startup (check logs)
- Database connection failed (see PostgreSQL section above)
- Missing environment variables

### Bot health check fails

```bash
# The bot may not have a /health endpoint
# Check if port 3002 is listening
curl -v http://localhost:3002/

# Check bot logs
docker compose -f docker-compose.azure.yml logs --tail=50 bot
```

**Common issues**:

- Bot needs WhatsApp QR scan on first run
- Missing `BOT_SECRET` or `OPENAI_API_KEY`

### Health check retries (CI/CD)

The GitHub Actions workflow retries 5 times with 10-second delays. If it still fails:

1. SSH into the VM and check logs manually
2. Verify all env vars are set in `.env.azure`
3. Check if Docker images exist: `docker images | grep ipproyectos`

---

## Memory Issues

### Check memory usage

```bash
free -h
docker stats --no-stream
```

### Symptoms

| Symptom                    | Fix                                              |
| -------------------------- | ------------------------------------------------ |
| `OOMKilled` in `docker ps` | Container exceeded memory limit                  |
| High swap usage            | Add more swap or upgrade VM                      |
| Slow response times        | Check `docker stats` for memory-hungry container |

### Solutions

1. **Check swap**:

   ```bash
   sudo swapon --show
   # Should show a 2GB swap file
   ```

2. **Increase swap** (if needed):

   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

3. **Upgrade VM** (if consistently running out):

   ```bash
   # In terraform.tfvars, change vm_size:
   vm_size = "Standard_B2as_v2"  # 4 vCPU, 8 GB RAM
   # Then:
   terraform apply -var-file=terraform.tfvars
   ```

4. **Add memory limits** to containers in `docker-compose.azure.yml`:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 2G
   ```

---

## Logs and Debugging

### View all logs

```bash
# Follow all containers
docker compose -f docker-compose.azure.yml logs -f

# Specific container
docker compose -f docker-compose.azure.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.azure.yml logs --tail=100 backend
```

### System logs

```bash
# Nginx access log
sudo tail -50 /var/log/nginx/nexoreal-access.log

# Nginx error log
sudo tail -50 /var/log/nginx/nexoreal-error.log

# Provision log (if something failed during setup)
sudo tail -100 /var/log/nexoreal-provision.log

# Cloudflared logs
sudo journalctl -u cloudflared --no-pager -n 50
```

### Useful one-liners

```bash
# Check if ports are listening
ss -tlnp | grep -E ':(80|3000|3002|5432)'

# Check disk usage
df -h

# Check running processes
docker compose -f docker-compose.azure.yml ps -a

# Test Nginx config
sudo nginx -t

# Restart everything
sudo systemctl restart nginx && docker compose -f docker-compose.azure.yml restart
```

---

_Nexo Real — Azure VM Infrastructure_
