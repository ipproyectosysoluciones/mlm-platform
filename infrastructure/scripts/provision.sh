#!/usr/bin/env bash
# =============================================================================
# Nexo Real — VPS Provisioning Script
# Generic: works on Ubuntu/Debian VPS (Azure, Hostinger, DonWeb, any provider)
#
# What this script does:
#   1. Detect OS (Ubuntu/Debian)
#   2. Update system packages
#   3. Install Docker + Docker Compose plugin
#   4. Create 2GB swap file
#   5. Install Nginx (system package)
#   6. Install cloudflared (Cloudflare tunnel client)
#   7. Create deploy user with sudo + docker access
#   8. Harden SSH (disable root login, key-only auth)
#   9. Create /opt/nexo-real directory
#  10. Create .env.production template
#
# Usage:
#   sudo bash provision.sh
#
# Run once on first boot. Idempotent — safe to re-run.
# =============================================================================
set -euo pipefail

LOG_FILE="/var/log/nexoreal-provision.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "============================================"
echo " Nexo Real — VPS Provisioning"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

# ─── 1. Detect OS ───────────────────────────────────────────────────────────

detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_ID="$ID"
    OS_VERSION="$VERSION_ID"
  else
    echo "ERROR: Cannot detect OS. /etc/os-release not found."
    exit 1
  fi

  if [[ "$OS_ID" != "ubuntu" && "$OS_ID" != "debian" ]]; then
    echo "ERROR: Unsupported OS: $OS_ID. Only Ubuntu and Debian are supported."
    exit 1
  fi

  echo "Detected OS: $OS_ID $OS_VERSION"
}

detect_os

# ─── 2. Update packages ─────────────────────────────────────────────────────

echo ""
echo "--- Updating system packages ---"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl \
  wget \
  git \
  unzip \
  ca-certificates \
  gnupg \
  lsb-release \
  software-properties-common

# ─── 3. Install Docker + Docker Compose plugin ──────────────────────────────

echo ""
echo "--- Installing Docker ---"
if command -v docker &>/dev/null; then
  echo "Docker already installed: $(docker --version)"
else
  # Add Docker's official GPG key
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  # Add Docker repository
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  # Start and enable Docker
  systemctl enable docker
  systemctl start docker

  echo "Docker installed: $(docker --version)"
  echo "Docker Compose: $(docker compose version)"
fi

# ─── 4. Create 2GB swap file ────────────────────────────────────────────────

echo ""
echo "--- Configuring swap ---"
SWAP_FILE="/swapfile"
if swapon --show | grep -q "$SWAP_FILE"; then
  echo "Swap already active: $(swapon --show | grep $SWAP_FILE)"
else
  echo "Creating 2GB swap file..."
  fallocate -l 2G "$SWAP_FILE"
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE"
  swapon "$SWAP_FILE"

  # Make swap permanent
  if ! grep -q "$SWAP_FILE" /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
  fi

  # Adjust swappiness for small VMs
  sysctl vm.swappiness=10
  if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo "vm.swappiness=10" >> /etc/sysctl.conf
  fi

  echo "Swap created: $(swapon --show | grep $SWAP_FILE)"
fi

# ─── 5. Install Nginx ──────────────────────────────────────────────────────

echo ""
echo "--- Installing Nginx ---"
if command -v nginx &>/dev/null; then
  echo "Nginx already installed: $(nginx -v 2>&1)"
else
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
  echo "Nginx installed: $(nginx -v 2>&1)"
fi

# ─── 6. Install cloudflared ────────────────────────────────────────────────

echo ""
echo "--- Installing cloudflared ---"
if command -v cloudflared &>/dev/null; then
  echo "cloudflared already installed: $(cloudflared --version 2>&1 | head -1)"
else
  # Detect architecture
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64)  CF_ARCH="amd64" ;;
    aarch64) CF_ARCH="arm64" ;;
    armv7l)  CF_ARCH="arm"   ;;
    *)       echo "ERROR: Unsupported architecture: $ARCH"; exit 1 ;;
  esac

  CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}"
  curl -fsSL "$CF_URL" -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
  echo "cloudflared installed: $(cloudflared --version 2>&1 | head -1)"
fi

# ─── 7. Create deploy user ─────────────────────────────────────────────────

echo ""
echo "--- Creating deploy user ---"
DEPLOY_USER="deploy"
if id "$DEPLOY_USER" &>/dev/null; then
  echo "User '$DEPLOY_USER' already exists"
else
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"

  # Passwordless sudo for deploy operations
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/systemctl, /usr/bin/cp, /usr/bin/mv, /usr/bin/chown, /usr/bin/chmod, /usr/bin/mkdir" | \
    tee "/etc/sudoers.d/$DEPLOY_USER" > /dev/null
  chmod 440 "/etc/sudoers.d/$DEPLOY_USER"

  echo "User '$DEPLOY_USER' created with sudo + docker access"
fi

# ─── 8. Harden SSH ─────────────────────────────────────────────────────────

echo ""
echo "--- Hardening SSH ---"
SSHD_CONFIG="/etc/ssh/sshd_config"
SSHD_BACKUP="/etc/ssh/sshd_config.bak.$(date +%s)"

if [ -f "$SSHD_CONFIG" ]; then
  cp "$SSHD_CONFIG" "$SSHD_BACKUP"

  # Disable root login
  sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "$SSHD_CONFIG"

  # Enforce key-only authentication (no passwords)
  sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD_CONFIG"
  sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSHD_CONFIG"

  # Disable empty passwords
  sed -i 's/^#\?PermitEmptyPasswords.*/PermitEmptyPasswords no/' "$SSHD_CONFIG"

  # Additional hardening
  sed -i 's/^#\?X11Forwarding.*/X11Forwarding no/' "$SSHD_CONFIG"

  systemctl restart sshd
  echo "SSH hardened: root login disabled, key-only auth enabled"
  echo "Backup saved to: $SSHD_BACKUP"
else
  echo "WARNING: $SSHD_CONFIG not found, skipping SSH hardening"
fi

# ─── 9. Create application directory ───────────────────────────────────────

echo ""
echo "--- Creating application directory ---"
APP_DIR="/opt/nexo-real"
mkdir -p "$APP_DIR"
chown "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"
echo "Application directory: $APP_DIR"

# ─── 10. Create .env.production template ────────────────────────────────────

echo ""
echo "--- Creating .env.production template ---"
ENV_FILE="$APP_DIR/.env.production"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" << 'ENVEOF'
# =============================================================================
# Nexo Real — Environment Variables (Production / Azure)
# Copy this file and fill in actual values
# NEVER commit the real .env.production
# =============================================================================

# Database — Azure Managed PostgreSQL
DB_DIALECT=postgres
DB_HOST=REPLACE_WITH_POSTGRES_FQDN
DB_PORT=5432
DB_NAME=mlm_db
DB_USER=mlm_admin
DB_PASSWORD=REPLACE_WITH_DB_PASSWORD
DATABASE_URL=postgresql://mlm_admin:REPLACE_WITH_DB_PASSWORD@REPLACE_WITH_POSTGRES_FQDN:5432/mlm_db?sslmode=require

# Bot — no n8n in Azure (deferred)
N8N_WEBHOOK_URL=

# Bot secrets
BOT_SECRET=REPLACE_WITH_BOT_SECRET
OPENAI_API_KEY=REPLACE_WITH_OPENAI_KEY
ENVEOF
  chown "$DEPLOY_USER":"$DEPLOY_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Created: $ENV_FILE (fill in real values before deploying)"
else
  echo "$ENV_FILE already exists, skipping"
fi

# ─── Done ──────────────────────────────────────────────────────────────────

echo ""
echo "============================================"
echo " Provisioning complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Copy your docker-compose.azure.yml to $APP_DIR/"
echo "  2. Fill in $ENV_FILE with real values"
echo "  3. Deploy: cd $APP_DIR && docker compose -f docker-compose.azure.yml --env-file .env.production up -d"
echo ""
echo "SSH as deploy user: ssh deploy@<VM_IP>"
echo "Log saved to: $LOG_FILE"
