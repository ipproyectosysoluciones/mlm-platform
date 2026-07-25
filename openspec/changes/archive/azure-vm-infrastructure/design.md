# Design: Azure VM Infrastructure

## Technical Approach

Deploy Nexo Real backend + bot on an Azure B2ats v2 VM with managed PostgreSQL, provisioned via Terraform and automated via GitHub Actions. The architecture mirrors the existing local `docker-compose.prod.yml` pattern but strips postgres/redis/n8n (external managed DB, deferred services). Cloudflare tunnel provides SSL termination and domain routing without open ports.

## Architecture Decisions

| Decision | Option A | Option B | Option C | Tradeoff | Decision |
|----------|----------|----------|----------|----------|----------|
| PostgreSQL | Azure Managed DB (B1MS) | Container on VM | — | Managed: auto-backups, no ops, but $0/mo free vs container: free, but manual backup | **Azure Managed DB** — reduced ops burden, automatic backups, scales later |
| Nginx placement | System package on VM | Docker container | — | System: simpler, no extra container; Container: reproducible | **System package** — one less container, simpler provisioning, already used in spec |
| Cloudflare tunnel | cloudflared on VM | — | — | Only option for tunnel approach | **cloudflared systemd service** — auto-restart, matches spec |
| CD trigger | Push to `development` | Manual dispatch | Both | Auto: fast iteration; Manual: more control | **Push to `development`** — matches existing cd-backend.yml pattern |
| SSH deploy method | appleboy/ssh-action | Raw SSH script | — | appleboy: reusable, matches existing pattern | **appleboy/ssh-action** — consistent with cd-backend.yml |

## Data Flow

```
User → Cloudflare (nexoreal.xyz) → cloudflared tunnel → Nginx (:80)
                                                            ├─ /api/*  → backend (:3000) → Azure PostgreSQL
                                                            └─ /bot/*  → bot (:3002)    → Azure PostgreSQL
                                                                                            ↑
GitHub Actions (push dev) → Docker Hub → SSH → docker compose pull → containers restart
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/main.tf` | Create | Resource group, VM, NSG, public IP, SSH key, PostgreSQL Flexible Server |
| `infrastructure/terraform/variables.tf` | Create | Input variables (region, ssh_key, db_password, etc.) |
| `infrastructure/terraform/outputs.tf` | Create | VM public IP, PostgreSQL FQDN, SSH command |
| `infrastructure/terraform/terraform.tfvars.example` | Create | Example variable values (no real secrets) |
| `infrastructure/provision.sh` | Create | First-boot script: swap, Docker, Nginx, cloudflared, user setup |
| `infrastructure/nginx/nexoreal.conf` | Create | Nginx reverse proxy config for backend + bot |
| `infrastructure/cloudflared/config.yml` | Create | Cloudflared tunnel configuration |
| `docker-compose.azure.yml` | Create | Azure-specific compose: backend + bot only, external DB |
| `.env.azure.example` | Create | Example env file with Azure DB connection string placeholders |
| `.github/workflows/cd-azure.yml` | Create | CD pipeline: build → push → SSH deploy → health check |
| `docs/AZURE-SETUP.md` | Create | Full setup guide (secrets hidden) |

**Total: 11 new files, 0 modified, 0 deleted**

## Interfaces / Contracts

### Environment Variables (`.env.azure` on VM)

```bash
# Database — Azure Managed PostgreSQL
DB_DIALECT=postgres
DB_HOST=nexoreal-db.postgres.database.azure.com
DB_PORT=5432
DB_NAME=mlm_db
DB_USER=mlm_admin
DB_PASSWORD=<YOUR_DB_PASSWORD>
DATABASE_URL=postgresql://mlm_admin:<password>@nexoreal-db.postgres.database.azure.com:5432/mlm_db?sslmode=require

# Bot — no n8n dependency in Azure
N8N_WEBHOOK_URL=  # empty — n8n deferred
```

### Docker Compose (`docker-compose.azure.yml`) Key Differences

- Removes `postgres`, `redis`, `n8n` services (external managed DB)
- Backend `DB_HOST` points to Azure PostgreSQL FQDN (not `postgres` hostname)
- Bot `depends_on` removes `n8n` dependency
- Bot `MLM_BACKEND_URL` uses `http://backend:3000` (internal Docker network)
- Bot `N8N_WEBHOOK_URL` empty (n8n deferred)

### Nginx Config

```
server {
    listen 80;
    server_name nexoreal.xyz;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /bot/ {
        proxy_pass http://127.0.0.1:3002;
        # same headers
    }
}
```

### GitHub Actions Secrets Required

| Secret | Purpose |
|--------|---------|
| `AZURE_VM_IP` | VM public IP for SSH |
| `AZURE_VM_SSH_KEY` | Private SSH key (PEM format) |
| `AZURE_VM_USER` | SSH username (default: azureuser) |
| `DOCKERHUB_USERNAME` | Docker Hub namespace |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Infrastructure | Terraform plan succeeds | `terraform validate` + `terraform plan` (no apply in CI) |
| Provisioning | Script is idempotent | Run provision.sh twice on fresh VM, verify no errors |
| Compose | Services start with external DB | `docker compose -f docker-compose.azure.yml config` validates |
| Nginx | Proxy routes work | `curl localhost/api/health` and `curl localhost/bot/health` on VM |
| CD Pipeline | End-to-end deploy | Push to `development`, verify health check passes |
| Security | No secrets in code | Grep for hardcoded passwords, keys in committed files |

## Threat Matrix

This design involves shell commands (provision.sh), SSH automation (CD pipeline), subprocess execution (Docker), and process integration (systemd services).

| Boundary | Applicability | Design Response | RED Tests |
|----------|--------------|-----------------|-----------|
| Documentation-like paths | N/A — no executable Markdown or unusual file classification in this change | — | — |
| Git repository selection | N/A — CD uses fixed repo checkout via actions/checkout@v4, no dynamic git selectors | — | — |
| Commit state | N/A — no commit automation in this change | — | — |
| Push state | N/A — no push automation beyond standard GitHub Actions | — | — |
| PR commands | N/A — no PR automation in this change | — | — |

**Note**: The CD pipeline uses SSH remote commands (`appleboy/ssh-action`) which execute shell commands on the VM. This is a controlled boundary — commands are fixed strings in the workflow YAML, not user-injectable. The provision.sh script runs once at boot and is not re-invoked by CI.

## Migration / Rollout

### First-Time Setup (One-Time)

1. Generate SSH key pair: `ssh-keygen -t ed25519 -f ~/.ssh/azure_vm_key`
2. Set Azure credentials: `export ARM_CLIENT_ID=... ARM_TENANT_ID=... ARM_SUBSCRIPTION_ID=... ARM_CLIENT_SECRET=...`
3. `cd infrastructure/terraform && terraform init && terraform apply`
4. SSH into VM: `ssh -i ~/.ssh/azure_vm_key azureuser@<VM_IP>`
5. Run provisioning: `sudo /opt/nexoreal/provision.sh`
6. Create `.env.azure` on VM with actual secrets
7. Deploy: `cd /opt/nexoreal && docker compose -f docker-compose.azure.yml --env-file .env.azure up -d`
8. Configure Cloudflare tunnel token in systemd service
9. Add GitHub Secrets for CD pipeline
10. Push to `development` to trigger first CD deploy

### Ongoing Deployments

Push to `development` → GitHub Actions builds images → SSH deploys → containers restart → health check verifies.

### Rollback

1. Revert push to `development` (git revert)
2. CD pipeline redeploys previous version automatically
3. Manual rollback: `ssh into VM → docker compose -f docker-compose.azure.yml --env-file .env.azure up -d --force-recreate`
4. Nuclear: `terraform destroy` removes all Azure resources

## Open Questions

- [ ] Should Nginx run as system package or Docker container? (Design uses system package per spec, but container would be more reproducible)
- [ ] Bot `depends_on: n8n` must be removed for Azure — is the bot functional without n8n webhooks? (Bot should work; n8n integration was for Google Calendar/Notion which can be added later)
- [ ] Azure PostgreSQL firewall: use VM public IP allowlist or VNet peering? (Design uses public IP for simplicity; VNet peering is more secure but complex)
