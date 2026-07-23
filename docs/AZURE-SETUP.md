# Azure VM Setup Guide — Nexo Real

Complete guide to deploy Nexo Real on Azure using Terraform IaC, Docker, and Cloudflare Tunnel.

> **Security**: All sensitive values are shown as `<PLACEHOLDER>`. Never commit real credentials.

---

## Prerequisites

| Requirement        | Purpose                                                               |
| ------------------ | --------------------------------------------------------------------- |
| Azure account      | VM + PostgreSQL hosting                                               |
| Docker Hub account | Host Docker images (`ipproyectos/mlm-backend`, `ipproyectos/mlm-bot`) |
| Cloudflare account | DNS + tunnel (free plan works)                                        |
| SSH key pair       | VM access                                                             |
| GitHub repo        | CI/CD via GitHub Actions                                              |

---

## Step 1: Azure Account Setup

1. Create an Azure account at [portal.azure.com](https://portal.azure.com)
2. Create a **Resource Group** (or let Terraform create one automatically)
3. Note your Azure subscription ID:
   ```bash
   az account show --query id -o tsv
   ```

---

## Step 2: SSH Key Generation

Generate a dedicated SSH key pair for VM access:

```bash
ssh-keygen -t ed25519 -C "nexoreal-deploy" -f ~/.ssh/nexoreal_deploy
```

- **Private key**: `~/.ssh/nexoreal_deploy` (keep secure, never commit)
- **Public key**: `~/.ssh/nexoreal_deploy.pub` (used by Terraform)

Copy the public key content for Terraform:

```bash
cat ~/.ssh/nexoreal_deploy.pub
# Output: ssh-ed25519 AAAAC3... nexoreal-deploy
```

---

## Step 3: Terraform Setup

### 3.1 Install Terraform

```bash
# Linux (HashiCorp APT repo)
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

### 3.2 Configure Variables

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your real values:

```hcl
location          = "brazilsouth"
vm_size           = "Standard_B2ats_v2"
admin_username    = "azureuser"
ssh_public_key    = "ssh-ed25519 AAAAC3... nexoreal-deploy"
postgres_password = "<YOUR_STRONG_PASSWORD>"
allowed_ssh_ips   = ["<YOUR_IP>", "<TEAM_MEMBER_IP>"]
```

> **Get your IP**: Search "what is my ip" in your browser, or use `curl ifconfig.me`

### 3.3 Initialize and Apply

```bash
cd infrastructure/terraform
terraform init
terraform plan    # Review what will be created
terraform apply   # Creates all Azure resources
```

Save the outputs:

```bash
terraform output
# vm_public_ip    = "<YOUR_VM_IP>"
# vm_ssh_command   = "ssh azureuser@<YOUR_VM_IP>"
# postgres_fqdn    = "<YOUR_DB>.postgres.database.azure.com"
# postgres_port    = "5432"
```

### 3.4 Cost Estimate

| Resource           | SKU                     | Monthly Cost (approx) |
| ------------------ | ----------------------- | --------------------- |
| VM (B2ats v2)      | 2 vCPU, 4 GB RAM        | ~$30 USD              |
| PostgreSQL (B1MS)  | 1 vCPU, 2 GB RAM, 32 GB | ~$15 USD              |
| Public IP (static) | Standard                | ~$4 USD               |
| **Total**          |                         | **~$49 USD/month**    |

---

## Step 4: First VM Provisioning

SSH into the newly created VM:

```bash
ssh -i ~/.ssh/nexoreal_deploy azureuser@<YOUR_VM_IP>
```

Upload and run the provisioning script:

```bash
# From your local machine:
scp -i ~/.ssh/nexoreal_deploy infrastructure/scripts/provision.sh azureuser@<YOUR_VM_IP>:~/

# On the VM:
sudo bash provision.sh
```

The script installs:

1. Docker + Docker Compose plugin
2. Nginx (reverse proxy)
3. cloudflared (Cloudflare tunnel)
4. 2 GB swap file
5. `deploy` user with sudo + Docker access
6. SSH hardening (key-only, no root login)
7. `/opt/nexo-real` directory with `.env.production` template

---

## Step 5: Server Initial Setup

After provisioning completes:

```bash
# Switch to deploy user
sudo su - deploy

# Clone the repository
cd /opt/nexo-real
git clone https://github.com/ipproyectosysoluciones/mlm-platform.git .

# Copy Docker Compose file to deploy directory
cp docker-compose.azure.yml /opt/nexo-real/
```

---

## Step 6: Environment Configuration

### 6.1 Copy the template

```bash
cp .env.azure.example .env.azure
```

### 6.2 Fill in real values

```bash
nano .env.azure
```

Key variables to set:

| Variable                   | How to get it                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `DB_HOST`                  | Terraform output `postgres_fqdn`                                                       |
| `DB_PASSWORD`              | The password you set in `terraform.tfvars`                                             |
| `DATABASE_URL`             | `postgresql://mlm_admin:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5432/mlm_db?sslmode=require` |
| `JWT_SECRET`               | `openssl rand -hex 64`                                                                 |
| `TWO_FACTOR_SECRET_KEY`    | `openssl rand -hex 32`                                                                 |
| `BOT_SECRET`               | `openssl rand -hex 32`                                                                 |
| `OPENAI_API_KEY`           | From OpenAI dashboard                                                                  |
| `BREVO_API_KEY`            | From Brevo dashboard                                                                   |
| `BREVO_SMTP_PASS`          | From Brevo SMTP settings                                                               |
| `VAPID_PUBLIC_KEY`         | `npx web-push generate-vapid-keys`                                                     |
| `VAPID_PRIVATE_KEY`        | Same command output                                                                    |
| `PAYPAL_CLIENT_ID`         | From PayPal developer dashboard                                                        |
| `PAYPAL_CLIENT_SECRET`     | From PayPal developer dashboard                                                        |
| `MERCADOPAGO_ACCESS_TOKEN` | From MercadoPago dashboard                                                             |

### 6.3 Secure the file

```bash
chmod 600 .env.azure
```

---

## Step 7: Deploy First Version

```bash
cd /opt/nexo-real

# Pull and start containers
docker compose -f docker-compose.azure.yml --env-file .env.azure up -d

# Check status
docker compose -f docker-compose.azure.yml ps

# View logs
docker compose -f docker-compose.azure.yml logs -f
```

Verify health:

```bash
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok",...}
```

---

## Step 8: Cloudflare Tunnel Setup

### 8.1 Create a tunnel

In the Cloudflare dashboard:

1. Go to **Networks > Tunnels**
2. Click **Create a tunnel**
3. Name it `nexoreal`
4. Copy the tunnel token

### 8.2 Install the tunnel token on the VM

```bash
# On the VM as deploy user:
sudo mkdir -p /etc/cloudflared

# Create the config
cat > /tmp/cloudflared-config.yml << 'EOF'
ingress:
  - hostname: nexoreal.xyz
    service: http://localhost:80
    originRequest:
      noTLSVerify: false
      keepAliveConnections: 10
      keepAliveTimeout: 90s
  - hostname: www.nexoreal.xyz
    service: http://localhost:80
  - service: http_status:404
EOF

sudo cp /tmp/cloudflared-config.yml /etc/cloudflared/config.yml
```

### 8.3 Run cloudflared as systemd service

```bash
sudo cloudflared service install <YOUR_TUNNEL_TOKEN>
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

### 8.4 Configure DNS in Cloudflare

In the Cloudflare dashboard:

1. Go to **DNS > Records**
2. Add CNAME record: `nexoreal` → `<YOUR_TUNNEL_ID>.cfargotunnel.com` (proxied)
3. Add CNAME record: `www` → `<YOUR_TUNNEL_ID>.cfargotunnel.com` (proxied)

### 8.5 Install Nginx config

```bash
sudo cp infrastructure/nginx/nexoreal.conf /etc/nginx/sites-available/nexoreal
sudo ln -sf /etc/nginx/sites-available/nexoreal /etc/nginx/sites-enabled/nexoreal
sudo nginx -t && sudo systemctl reload nginx
```

### 8.6 Test

```bash
curl -I https://nexoreal.xyz
# Expected: HTTP/2 200
```

---

## Step 9: GitHub Secrets Configuration

Go to your GitHub repo → **Settings > Secrets and variables > Actions** and add:

| Secret Name          | Value                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| `AZURE_VM_HOST`      | `<YOUR_VM_IP>`                                                                          |
| `AZURE_VM_USER`      | `deploy`                                                                                |
| `AZURE_VM_SSH_KEY`   | Contents of `~/.ssh/nexoreal_deploy` (private key, full file including BEGIN/END lines) |
| `AZURE_VM_PATH`      | `/opt/nexo-real`                                                                        |
| `DOCKERHUB_USERNAME` | Your Docker Hub username                                                                |
| `DOCKERHUB_TOKEN`    | Docker Hub access token (not password)                                                  |

### Generate Docker Hub token

1. Log in to [hub.docker.com](https://hub.docker.com)
2. Go to **Account Settings > Security > Access Tokens**
3. Create a new token with **Read & Write** permissions

### Create GitHub environment

1. Go to **Settings > Environments**
2. Create environment: `azure-development`
3. (Optional) Add required reviewers for deployment approval

---

## Step 10: First CI/CD Deploy

Push to `development` to trigger the CD pipeline:

```bash
git checkout development
git merge feature/azure-docs  # or your feature branch
git push origin development
```

The GitHub Actions workflow (`cd-azure.yml`) will:

1. Build backend Docker image → push to Docker Hub
2. Build bot Docker image → push to Docker Hub
3. SSH into the VM → pull images → restart containers
4. Run health checks (5 retries, 10s delay)

Monitor the workflow:

```bash
gh run list --workflow=cd-azure.yml
gh run watch <RUN_ID>
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and fixes.

---

## Security Checklist

- [ ] SSH key-only authentication (no password login)
- [ ] Root login disabled on VM
- [ ] NSG restricts SSH to team IPs only
- [ ] NSG restricts HTTP/HTTPS to Cloudflare IPs only
- [ ] `.env.azure` has `chmod 600` (deploy user only)
- [ ] `.env.azure` is in `.gitignore`
- [ ] PostgreSQL password is strong (32+ characters)
- [ ] PostgreSQL firewall allows only VM IP and team IPs
- [ ] Docker images are pushed to Docker Hub (no local builds)
- [ ] Cloudflare tunnel handles TLS termination (Nginx runs HTTP only)
- [ ] GitHub Secrets are set (not in repo files)
- [ ] No real credentials in `terraform.tfvars` (use `.gitignore`)
- [ ] Sentry DSN configured for error monitoring
- [ ] Automated backups enabled (see `infrastructure/scripts/backup-db.sh`)

---

## Architecture Overview

See [AZURE-ARCHITECTURE.md](AZURE-ARCHITECTURE.md) for a visual overview of the infrastructure.

---

_Nexo Real — Azure VM Infrastructure_
