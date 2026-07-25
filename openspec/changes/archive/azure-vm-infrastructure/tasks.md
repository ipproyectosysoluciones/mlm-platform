# Tasks: Azure VM Infrastructure

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 550-750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Terraform IaC + provision script | PR 1 | `terraform validate && terraform plan` | N/A — requires Azure subscription to apply | `infrastructure/` dir only; no app code touched |
| 2 | Docker Compose + Nginx + configs | PR 2 | `docker compose -f docker-compose.azure.yml config` | `docker compose up -d` on local/VM | Compose/config files; no infra or CI files |
| 3 | CI/CD pipeline + deploy scripts | PR 3 | `act -j build -W .github/workflows/cd-azure.yml` (dry-run) | Push to dev branch triggers pipeline | `.github/workflows/` + deploy scripts only |
| 4 | Documentation | PR 4 | `markdownlint docs/AZURE-SETUP.md` | N/A — docs only | `docs/` dir only |

## Phase 1: Terraform Infrastructure (Azure-Specific)

- [x] 1.1 Create `infrastructure/terraform/main.tf` — resource group, B2ats v2 VM, NSG (22/80/443), public IP, SSH key, PostgreSQL Flexible Server (B1MS, 32GB, auto-failoff)
- [x] 1.2 Create `infrastructure/terraform/variables.tf` — region, vm_size, ssh_public_key, db_password, admin_username, tags
- [x] 1.3 Create `infrastructure/terraform/outputs.tf` — vm_public_ip, postgres_fqdn, ssh_command
- [x] 1.4 Create `infrastructure/terraform/terraform.tfvars.example` — all variables with placeholder values, no real secrets
- [x] 1.5 Verify: run `terraform validate` and `terraform plan` (no apply) — BLOCKED: terraform not installed locally; validate on VM or CI

## Phase 2: Generic VPS Provisioning

- [x] 2.1 Create `infrastructure/scripts/provision.sh` — detect Ubuntu/Debian, apt update, install Docker + Compose plugin, create 2GB swap, install Nginx, install cloudflared, harden SSH (disable root, key-only), create `deploy` user with docker group
- [ ] 2.2 Create `infrastructure/nginx/nexoreal.conf` — reverse proxy: `:80` → backend `:3000` (`/api/`), bot `:3002` (`/bot/`), proxy headers, client_max_body_size 10m
- [ ] 2.3 Create `infrastructure/cloudflared/config.yml` — tunnel config pointing to localhost:80, hostname nexoreal.xyz
- [ ] 2.4 Verify: `shellcheck infrastructure/provision.sh` — no warnings; `nginx -t -c infrastructure/nginx/nexoreal.conf` — syntax valid

## Phase 3: Docker Compose + Environment

- [ ] 3.1 Create `docker-compose.azure.yml` — services: backend (ipproyectos/mlm-backend), bot (ipproyectos/mlm-bot); external DB via env vars; no postgres/redis/n8n; healthcheck on both services
- [ ] 3.2 Create `.env.azure.example` — DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DATABASE_URL template; N8N_WEBHOOK_URL empty; all values placeholder
- [ ] 3.3 Verify: `docker compose -f docker-compose.azure.yml config` validates without errors

## Phase 4: CI/CD Pipeline

- [ ] 4.1 Create `.github/workflows/cd-azure.yml` — trigger: push to `development`; jobs: build-backend, build-bot, push to Docker Hub, SSH deploy via appleboy/ssh-action, health check
- [ ] 4.2 Create `infrastructure/scripts/deploy.sh` — generic: pull images, `docker compose up -d --force-recreate`, wait for health, cleanup old images
- [ ] 4.3 Create `infrastructure/scripts/backup-db.sh` — pg_dump to timestamped file; works with both localhost container and Azure DB FQDN via env var
- [ ] 4.4 Verify: `act -j build -W .github/workflows/cd-azure.yml` (local dry-run) — workflow syntax valid

## Phase 5: Documentation

- [ ] 5.1 Create `docs/AZURE-SETUP.md` — prerequisites, SSH key generation, Terraform apply, provisioning, .env setup, Cloudflare tunnel, GitHub Secrets, first deploy, rollback procedure
- [ ] 5.2 Create `docs/ARCHITECTURE.md` — portable architecture diagram (text), explains what's generic vs Azure-specific, portability notes for Hostinger/DonWeb
- [ ] 5.3 Verify: all doc links resolve, no hardcoded secrets in any committed file (`grep -r "password\|secret\|key" --include="*.tf" --include="*.sh" --include="*.yml"` returns clean)
