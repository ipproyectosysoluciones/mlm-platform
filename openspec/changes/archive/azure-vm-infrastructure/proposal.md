# Proposal: Azure VM Infrastructure for Sprint 20

## Intent

The project currently lacks a cloud deployment target; the only production-like environment is local Docker Compose. To enable testing, demo, and future production deployments, we need a repeatable, automated infrastructure setup on Azure. The user wants a low-cost (free‑tier) Ubuntu VM with Terraform provisioning, Docker Compose for services, and CI/CD via GitHub Actions. The primary pain is manual, undocumented server setup that cannot be reproduced or shared.

## Scope

### In Scope
- Terraform IaC to provision an Azure B1S Linux VM (Ubuntu 24.04 LTS) and associated resources (NSG, public IP, SSH key).
- Provisioning scripts (bash/ansible) for OS hardening, Docker installation, and Docker Compose deployment.
- Docker Compose configuration for backend, bot, PostgreSQL, and optional Redis (disabled by default).
- PostgreSQL decision: recommend container with 2 GB swap file (memory‑efficient) vs. Azure DB free tier trade‑offs.
- Nginx or Caddy as reverse proxy with automatic SSL via Cloudflare tunnel.
- GitHub Actions CD workflow to build Docker images, push to Docker Hub, and SSH‑deploy to the VM.
- Cloudflare tunnel integration for `nexoreal.xyz` domain (proxied, no open ports).
- Documentation that hides sensitive info (passwords, keys, tokens).

### Out of Scope
- Production‑grade scaling, load balancing, or multi‑region.
- Kubernetes, Terraform modules for complex networking.
- n8n deployment (too heavy for 1 GB RAM; deferred).
- Redis deployment (backend can run without it for testing).
- Monitoring, logging, alerting stack.
- Automated database migrations (handled by backend on startup).

## Capabilities

### New Capabilities
- `cloud-infrastructure`: IaC, provisioning, and deployment scripts for Azure VM, Docker Compose, reverse proxy, and CI/CD pipeline.

### Modified Capabilities
None.

## Approach

1. **Terraform** (azurerm provider) creates resource group, B1S VM, NSG (SSH+HTTP/HTTPS), public IP, and attaches SSH key.
2. **Provisioning script** runs on first boot: updates packages, installs Docker, adds swap file (2 GB), clones repo, runs `docker compose up -d`.
3. **Docker Compose** defines services: `backend`, `bot`, `postgres` (with volume), and optional `redis` (commented out). Memory budget: OS ~200 MB, PostgreSQL ~100 MB, backend ~150 MB, total < 500 MB + 2 GB swap.
4. **PostgreSQL** container with persistent volume; authentication via `POSTGRES_PASSWORD` (generated, stored in `.env`).
5. **Nginx** container reverse‑proxies to backend (port 80/443 → 3000) and bot (port 3002). SSL termination via Cloudflare tunnel (no need for Let's Encrypt).
6. **GitHub Actions** (`cd-azure.yml`) triggered on push to `development`: builds images, pushes to Docker Hub, SSHes into VM, pulls images, and restarts containers.
7. **Cloudflare** tunnel configured via `cloudflared` on the VM, pointing to Nginx. Domain `nexoreal.xyz` proxied through tunnel; DNS managed in Cloudflare dashboard.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/changes/azure-vm-infrastructure/` | New | Proposal and subsequent specs/design/tasks |
| `infrastructure/` | New | Terraform configs, provisioning scripts, Docker Compose, Nginx config |
| `.github/workflows/cd-azure.yml` | New | CD pipeline for Azure deployment |
| `docker-compose.prod.yml` | Modified | May need adjustments for Azure environment variables |
| `README.md` | Modified | Add deployment instructions (hide secrets) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Azure free‑tier Linux B1S is not “Always Free” (Windows only) | High | Inform user; use $200 credit or accept ~$8/month cost. Document trade‑offs. |
| 1 GB RAM insufficient for all services | High | Disable Redis and n8n; use swap file; profile memory usage. |
| SSH key compromise | Medium | Store private key in GitHub Secrets only; restrict VM SSH to specific IP via NSG. |
| Docker images too large for B1S storage (30 GB) | Low | Use multi‑stage builds, keep images minimal; monitor disk usage. |
| Cloudflare tunnel downtime | Low | Use cloudflared systemd service with auto‑restart; fallback to direct IP if needed. |

## Rollback Plan

1. **Terraform destroy** removes all Azure resources (VM, NSG, IP) – no data loss if PostgreSQL volume is backed up.
2. **GitHub Actions** can be disabled by removing workflow file or adding a condition.
3. **Docker Compose** can be stopped via SSH (`docker compose down`) – services remain stopped.
4. **Cloudflare tunnel** can be paused in dashboard; domain reverts to previous DNS (if any).
5. **Backup**: Before any destructive action, export PostgreSQL dump via `docker exec postgres pg_dump`.

## Dependencies

- Azure subscription with $200 free credit or willingness to pay ~$8/month.
- SSH key pair (public key stored in Azure, private key in GitHub Secrets).
- Docker Hub account for image storage.
- Cloudflare account with `nexoreal.xyz` domain configured.
- GitHub repository secrets: `AZURE_VM_IP`, `AZURE_VM_SSH_KEY`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.

## Success Criteria

- [ ] Terraform apply successfully creates a B1S VM with SSH access.
- [ ] Provisioning script installs Docker, creates swap, and deploys containers.
- [ ] Backend and bot containers are reachable via Cloudflare tunnel at `nexoreal.xyz`.
- [ ] PostgreSQL container persists data across container restarts.
- [ ] GitHub Actions CD workflow builds and deploys on push to `development`.
- [ ] Memory usage stays below 800 MB (with swap) under normal load.
- [ ] Documentation covers setup without exposing secrets.

## Proposal Question Round

*The following questions are meant to improve the proposal by uncovering business rules, implications, and trade‑offs. Please answer, skip, or correct the framing.*

1. **Business problem**: Is the primary goal testing/demos, or do you anticipate production traffic on this VM? This affects scaling and monitoring decisions.

2. **Target users**: Who will access this deployment? Developers only, or also clients/demos? This influences security (IP whitelisting, authentication).

3. **Business rules**: Are there compliance or data‑residency requirements (e.g., data must stay in a specific Azure region)? The default region is East US.

4. **Product outcome**: After deployment, what should be possible? For example: “Run the full stack with one command” or “Automatically deploy latest changes.”

5. **Current‑state gap**: What is the biggest pain today? Manual setup, lack of reproducibility, or something else?

*Assumptions based on your description:*
- Testing server only; no production traffic expected.
- Single developer access; no need for multi‑user SSH.
- No compliance constraints; East US region is acceptable.
- One‑command deployment is the goal.
- Biggest pain is manual, undocumented setup.

If these assumptions are correct, we can proceed. If not, please correct and we’ll run a second question round.