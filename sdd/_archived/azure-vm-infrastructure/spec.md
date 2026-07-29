# Azure VM Infrastructure Specification

## Purpose

Define infrastructure-as-code, provisioning, deployment, and operations for running Nexo Real backend + bot on Azure B2ats v2 VM with managed PostgreSQL, Nginx, Cloudflare tunnel, and GitHub Actions CD.

---

## 1. Cloud Infrastructure (Terraform)

### Requirement: Azure VM Provisioning

The system SHALL provision an Azure B2ats v2 VM (AMD, 2 vCPU, 4GB RAM) running Ubuntu 24.04 LTS via Terraform.

- **SKU**: Standard_B2ats_v2 (12-month free tier eligible)
- **OS**: Ubuntu 24.04 LTS
- **SSH Key**: Public key injected via `azurerm_linux_virtual_machine` admin_ssh_key
- **Region**: `brazilsouth` preferred; `eastus2` fallback

#### Scenario: Terraform apply creates VM

- GIVEN Terraform config with valid Azure credentials
- WHEN `terraform apply` is executed
- THEN a B2ats v2 VM is created with the specified SSH key
- AND the VM output includes public_ip and admin_username

#### Scenario: SSH key injection

- GIVEN an SSH public key at `~/.ssh/azure_vm_key.pub`
- WHEN Terraform creates the VM
- THEN the public key is configured for the admin user
- AND password authentication is disabled

### Requirement: Network Security Group

The system SHALL configure an NSG allowing only SSH (22), HTTP (80), and HTTPS (443) inbound.

#### Scenario: NSG rules applied

- GIVEN the NSG resource in Terraform
- WHEN the VM is created
- THEN inbound rules allow ports 22, 80, 443 only
- AND all other inbound traffic is denied by default

### Requirement: Public IP

The system SHALL allocate a static public IP for the VM.

#### Scenario: Public IP assigned

- GIVEN Terraform provisions a public IP
- WHEN the VM starts
- THEN a static IP is attached and output as `vm_public_ip`

### Requirement: Azure Database for PostgreSQL

The system SHALL provision an Azure Database for PostgreSQL Flexible Server (B1MS Burstable).

- **SKU**: B1MS (1 vCPU, 2GB RAM, 32GB SSD)
- **Backup**: 7-day retention minimum
- **Firewall**: Allow VM subnet or public IP only
- **SSL**: Required for all connections

#### Scenario: PostgreSQL provisioned

- GIVEN Terraform config for PostgreSQL Flexible Server
- WHEN `terraform apply` is executed
- THEN a B1MS PostgreSQL server is created
- AND the connection string is output as a Terraform output (sensitive)

#### Scenario: VM can connect to PostgreSQL

- GIVEN the VM and PostgreSQL are in the same region
- WHEN the backend container starts
- THEN it connects to PostgreSQL using the provided connection string
- AND the connection uses SSL

---

## 2. Server Provisioning

### Requirement: First-Boot Script

The system SHALL run a provisioning script on first VM boot that installs Docker, creates swap, and configures cloudflared.

- **Docker**: Latest stable via official install script
- **Docker Compose**: v2 plugin
- **Swap**: 2GB file-based swap
- **cloudflared**: Installed via apt repository
- **Nginx**: Installed and configured as reverse proxy

#### Scenario: Clean VM boot

- GIVEN a fresh Ubuntu 24.04 VM
- WHEN the provisioning script runs
- THEN Docker is installed and the service is active
- AND 2GB swap is configured
- AND cloudflared is installed
- AND nginx is installed

#### Scenario: Idempotent provisioning

- GIVEN the provisioning script has already run
- WHEN it runs again
- THEN no errors occur and existing config is preserved

---

## 3. Docker Compose (Azure)

### Requirement: Azure-Specific Compose File

The system SHALL use a `docker-compose.azure.yml` that runs only backend + bot containers with external PostgreSQL.

- **Backend**: `ipproyectos/mlm-backend:latest`
- **Bot**: `ipproyectos/mlm-bot:latest`
- **No local postgres/redis** — uses Azure managed PostgreSQL
- **Health checks**: Both services must expose health endpoints

#### Scenario: Services start with external DB

- GIVEN `docker-compose.azure.yml` and valid DATABASE_URL
- WHEN `docker compose -f docker-compose.azure.yml up -d` runs
- THEN backend and bot containers start
- AND both connect to Azure PostgreSQL
- AND health checks pass within 60 seconds

#### Scenario: Service restart on failure

- GIVEN a running backend container
- WHEN the container exits with non-zero code
- THEN Docker restarts it automatically (restart: unless-stopped)

---

## 4. Reverse Proxy (Nginx)

### Requirement: Nginx Reverse Proxy

The system SHALL configure Nginx to proxy requests to backend (port 3000) and bot (port 3002).

- `/api/*` → `http://localhost:3000`
- `/bot/*` → `http://localhost:3002`
- Health check endpoints exposed at `/health`

#### Scenario: Backend proxied

- GIVEN Nginx is running on port 80
- WHEN a request to `/api/health` arrives
- THEN Nginx proxies it to `http://localhost:3000/api/health`
- AND returns the upstream response

#### Scenario: Bot proxied

- GIVEN Nginx is running on port 80
- WHEN a request to `/bot/health` arrives
- THEN Nginx proxies it to `http://localhost:3002/health`
- AND returns the upstream response

---

## 5. Cloudflare Tunnel

### Requirement: cloudflared Systemd Service

The system SHALL run cloudflared as a systemd service tunneling traffic to Nginx on localhost:80.

- **Domain**: nexoreal.xyz
- **Service name**: `cloudflared`
- **Auto-restart**: Yes (systemd Restart=always)

#### Scenario: Tunnel establishes

- GIVEN cloudflared is configured with the tunnel token
- WHEN the systemd service starts
- THEN the tunnel connects to Cloudflare
- AND traffic to nexoreal.xyz reaches Nginx on the VM

#### Scenario: Tunnel auto-restarts

- GIVEN the cloudflared process crashes
- WHEN systemd detects the failure
- THEN the service restarts within 5 seconds
- AND the tunnel re-establishes

---

## 6. CI/CD Pipeline

### Requirement: GitHub Actions CD Workflow

The system SHALL deploy via GitHub Actions (`cd-azure.yml`) triggered on push to `development` branch.

- **Trigger**: Push to `development`
- **Steps**: Build → Push to Docker Hub → SSH deploy → docker compose pull + restart
- **Secrets**: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `AZURE_VM_IP`, `AZURE_VM_SSH_KEY`

#### Scenario: Successful deployment

- GIVEN code is pushed to `development`
- WHEN `cd-azure.yml` runs
- THEN Docker images are built and pushed to Docker Hub
- AND SSH connection to Azure VM is established
- AND `docker compose pull && docker compose up -d` runs on the VM
- AND backend and bot containers are updated

#### Scenario: Deployment fails at SSH

- GIVEN the Azure VM SSH key is invalid
- WHEN `cd-azure.yml` runs
- THEN the workflow fails with a clear error message
- AND no container restart occurs on the VM

---

## 7. Database Connectivity

### Requirement: PostgreSQL Connection from VM

The system SHALL connect the backend container to Azure Database for PostgreSQL using SSL.

- **Connection string**: Provided via `DATABASE_URL` environment variable
- **SSL mode**: Required (require or verify-full)
- **Firewall**: Azure DB allows the VM's public IP

#### Scenario: Connection with SSL

- GIVEN the VM has network access to Azure DB
- WHEN the backend starts with valid DATABASE_URL
- THEN it connects to PostgreSQL over SSL
- AND the connection pool is established

#### Scenario: Connection refused (firewall)

- GIVEN the VM's IP is not in Azure DB firewall rules
- WHEN the backend attempts to connect
- THEN the connection times out after 10 seconds
- AND the backend logs a clear error message

---

## 8. Security

### Requirement: SSH Key Management

The system SHALL use SSH key authentication only (no password).

- **Key storage**: GitHub Actions secrets (`AZURE_VM_SSH_KEY`)
- **Local key**: `~/.ssh/azure_vm_key` (private) and `.pub` (public)
- **Rotation**: Manual, documented in AZURE-SETUP.md

#### Scenario: SSH with key

- GIVEN a valid SSH private key
- WHEN `ssh -i ~/.ssh/azure_vm_key azureuser@<VM_IP>` runs
- THEN the connection succeeds

#### Scenario: SSH without key

- GIVEN no SSH key is provided
- WHEN SSH connection is attempted
- THEN the connection is refused (password auth disabled)

### Requirement: Secrets Handling

The system SHALL store all secrets in GitHub Actions secrets and Azure environment variables. No secrets in code.

- **GitHub secrets**: SSH key, Docker Hub credentials, Cloudflare token
- **VM secrets**: DATABASE_URL via `.env` file on the VM
- **Terraform secrets**: Azure credentials via `ARM_*` env vars or `~/.azure/credentials`

#### Scenario: No secrets in code

- GIVEN the repository source code
- WHEN inspected for secrets
- THEN no API keys, passwords, or tokens appear in committed files
- AND all secrets are referenced from environment or secrets store

### Requirement: Firewall Rules

The system SHALL restrict PostgreSQL access to the VM's public IP only.

#### Scenario: PostgreSQL firewall allows VM only

- GIVEN the Azure DB firewall rules
- WHEN the VM's public IP is added as a firewall rule
- THEN only that IP can connect to PostgreSQL
- AND all other IPs are rejected

---

## 9. Documentation

### Requirement: AZURE-SETUP.md Guide

The system SHALL include an `AZURE-SETUP.md` file documenting the full setup process.

- **Prerequisites**: Azure account, SSH key, Docker Hub, Cloudflare, GitHub
- **Terraform**: Step-by-step infrastructure creation
- **Provisioning**: First-boot script execution
- **Deployment**: GitHub Actions setup and secrets
- **Troubleshooting**: Common issues and fixes

#### Scenario: Developer follows setup guide

- GIVEN a new developer with Azure access
- WHEN they follow AZURE-SETUP.md
- THEN they can create infrastructure, deploy, and access the services
- AND no step requires undocumented knowledge

#### Scenario: Secrets not exposed in docs

- GIVEN AZURE-SETUP.md exists
- WHEN reviewed for sensitive data
- THEN no actual secrets, tokens, or credentials appear in the document
- AND all secret references use placeholder format (`<YOUR_SECRET>`)

---

## Constraints & Trade-offs

| Constraint              | Trade-off                      | Decision                                            |
| ----------------------- | ------------------------------ | --------------------------------------------------- |
| 4GB RAM                 | Tight for future services      | Acceptable for backend+bot; Redis/n8n deferred      |
| B2ats v2 12-month free  | Must migrate after expiry      | Plan for cost review at month 10                    |
| 32GB PostgreSQL         | Limited data growth            | Sufficient for testing; plan migration path         |
| Public IP on PostgreSQL | Slightly less secure than VNet | Acceptable for testing; VNet peering for production |
| No Redis                | Backend works without it       | Deferred; add when needed for caching/sessions      |

---

**Spec Version**: 1.0.0
**Created**: 2026-07-23
**Change**: azure-vm-infrastructure
**Status**: Ready for Design Phase
