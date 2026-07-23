# Azure Architecture Overview — Nexo Real

Infrastructure architecture for deploying Nexo Real on Azure VM with Cloudflare.

> This architecture is portable — the same Docker Compose works on any VPS (Azure, Hostinger, DonWeb, etc.). Azure-specific components are highlighted.

---

## System Diagram

```
                          ┌─────────────────────────────────────────────┐
                          │              INTERNET                       │
                          └─────────────────┬───────────────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────────────────┐
                          │          CLOUDFLARE (Free Plan)             │
                          │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
                          │  │ DNS      │  │ TLS      │  │ DDoS     │  │
                          │  │ Records  │  │ Certs    │  │ Protect  │  │
                          │  └──────────┘  └──────────┘  └──────────┘  │
                          └─────────────────┬───────────────────────────┘
                                            │ Tunnel (encrypted)
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AZURE VM (Standard_B2ats_v2)                            │
│                         Ubuntu 24.04 LTS | 2 vCPU | 4 GB RAM                    │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         cloudflared (systemd)                             │  │
│  │                    Ingress: nexoreal.xyz → localhost:80                    │  │
│  └───────────────────────────┬───────────────────────────────────────────────┘  │
│                              │                                                  │
│                              ▼                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         Nginx (port 80)                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  /           → backend:3000    (API rate limit: 30r/s)             │  │  │
│  │  │  /bot/       → bot:3002        (Bot rate limit: 10r/s)            │  │  │
│  │  │  /nginx-health → 200 OK        (Health check)                     │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └──────────┬──────────────────────────────────────┬─────────────────────────┘  │
│             │                                      │                            │
│             ▼                                      ▼                            │
│  ┌─────────────────────┐             ┌─────────────────────┐                   │
│  │   Backend (Docker)  │             │   Bot (Docker)      │                   │
│  │   127.0.0.1:3000    │             │   127.0.0.1:3002    │                   │
│  │                     │             │                     │                   │
│  │  Node.js + Express  │             │  Node.js + Baileys  │                   │
│  │  + TypeScript       │             │  + OpenAI           │                   │
│  │  + Sequelize ORM    │             │  WhatsApp Bot       │                   │
│  └──────────┬──────────┘             └─────────────────────┘                   │
│             │                                                                  │
│             │  (SSL required by Azure PostgreSQL)                               │
│             ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  /opt/nexo-real/                                                       │   │
│  │  ├── docker-compose.azure.yml                                          │   │
│  │  ├── .env.azure                                                        │   │
│  │  └── logs/                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         │  TCP/IP (port 5432, SSL)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    AZURE DATABASE FOR POSTGRESQL                                │
│                    Flexible Server (B1MS Burstable)                             │
│                    1 vCPU | 2 GB RAM | 32 GB Storage | PostgreSQL 16            │
│                                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                                     │
│  │ mlm_db   │  │ SSL/TLS  │  │ Backups  │                                     │
│  │ Database │  │ Required │  │ Daily    │                                     │
│  └──────────┘  └──────────┘  └──────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Network Flow

### Request Lifecycle

```
User Browser
    │
    ▼
Cloudflare (TLS termination)
    │  DNS resolves nexoreal.xyz
    │  TLS certificate auto-provisioned
    │  DDoS protection active
    │
    ▼ (Cloudflare Tunnel — encrypted)
cloudflared on VM
    │  Forwards to localhost:80
    │
    ▼
Nginx (port 80)
    │  Rate limiting applied
    │  Security headers added
    │  Gzip compression
    │
    ├── / ──────────► Backend (127.0.0.1:3000)
    │                    │
    │                    ▼
    │                 Azure PostgreSQL (port 5432, SSL)
    │
    └── /bot/ ─────► Bot (127.0.0.1:3002)
                       │
                       ├── OpenAI API
                       └── WhatsApp (Baileys)
```

### Database Connection Flow

```
Backend Container
    │
    │  DATABASE_URL: postgresql://mlm_admin:***@nexoreal-db.postgres.database.azure.com:5432/mlm_db?sslmode=require
    │
    ▼
Azure PostgreSQL Flexible Server
    │
    ├── Firewall Rule: AllowVM (VM public IP)
    ├── Firewall Rule: AllowTeam-IP1 (team member 1)
    ├── Firewall Rule: AllowTeam-IP2 (team member 2)
    └── SSL mode: require
```

---

## Azure-Specific Components

These components are Azure-native and only exist when deployed on Azure:

| Component      | Azure Resource                       | SKU               | Purpose                |
| -------------- | ------------------------------------ | ----------------- | ---------------------- |
| **VM**         | `azurerm_linux_virtual_machine`      | Standard_B2ats_v2 | Runs Docker containers |
| **PostgreSQL** | `azurerm_postgresql_flexible_server` | B1ms              | Managed database       |
| **VNet**       | `azurerm_virtual_network`            | —                 | Network isolation      |
| **NSG**        | `azurerm_network_security_group`     | —                 | Firewall rules         |
| **Public IP**  | `azurerm_public_ip`                  | Standard (static) | VM external access     |
| **NIC**        | `azurerm_network_interface`          | —                 | VM network interface   |

### Portable Components (work on any VPS)

| Component        | File                                    | Purpose                       |
| ---------------- | --------------------------------------- | ----------------------------- |
| Docker Compose   | `docker-compose.azure.yml`              | Container orchestration       |
| Nginx            | `infrastructure/nginx/nexoreal.conf`    | Reverse proxy                 |
| Cloudflared      | `infrastructure/cloudflared/config.yml` | Tunnel ingress                |
| Deploy script    | `infrastructure/scripts/deploy.sh`      | Pull + restart + health check |
| Provision script | `infrastructure/scripts/provision.sh`   | Server setup                  |

---

## Service Dependency Graph

```
                    ┌──────────┐
                    │ Internet │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │Cloudflare│
                    └────┬─────┘
                         │
                    ┌────▼──────┐
                    │cloudflared│
                    └────┬──────┘
                         │
                    ┌────▼─────┐
                    │  Nginx   │
                    └──┬───┬───┘
                       │   │
              ┌────────┘   └────────┐
              │                     │
         ┌────▼─────┐          ┌────▼─────┐
         │ Backend  │          │   Bot    │
         │ :3000    │          │  :3002   │
         └────┬─────┘          └──────────┘
              │
         ┌────▼──────────┐
         │ Azure Postgres │
         │ :5432 (SSL)    │
         └───────────────┘
```

### Container Health Checks

| Container | Check                                   | Interval | Timeout |
| --------- | --------------------------------------- | -------- | ------- |
| Backend   | `curl http://localhost:3000/api/health` | 30s      | 10s     |
| Bot       | TCP port 3002 open                      | 30s      | 10s     |

---

## Security Layers

```
Layer 1: Cloudflare DDoS + WAF (edge)
    │
Layer 2: Azure NSG (VM-level firewall)
    │  ├── SSH: team IPs only
    │  ├── HTTP: Cloudflare IPs only
    │  └── HTTPS: Cloudflare IPs only
    │
Layer 3: Nginx (application-level)
    │  ├── Rate limiting (30r/s API, 10r/s bot)
    │  ├── Security headers (X-Frame-Options, etc.)
    │  └── Blocks dotfile access
    │
Layer 4: Docker (container isolation)
    │  ├── Backend: 127.0.0.1:3000 (not exposed)
    │  ├── Bot: 127.0.0.1:3002 (not exposed)
    │  └── No privileged containers
    │
Layer 5: Azure PostgreSQL (database)
       ├── Firewall: VM IP + team IPs only
       ├── SSL required
       └── Strong password
```

---

## CI/CD Pipeline

```
Push to development
    │
    ▼
GitHub Actions (cd-azure.yml)
    │
    ├──► Build Backend Image → Docker Hub (ipproyectos/mlm-backend:development)
    │
    ├──► Build Bot Image → Docker Hub (ipproyectos/mlm-bot:development)
    │
    └──► Deploy (SSH into VM)
         │
         ├── docker pull images
         ├── docker compose up -d
         ├── sleep 20 (init)
         └── health check (5 retries)
```

---

## Resource Tagging

All Azure resources are tagged:

```
Project:     NexoReal
ManagedBy:   Terraform
Environment: production
```

---

_Nexo Real — Azure VM Infrastructure_
