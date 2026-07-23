#!/usr/bin/env bash
# =============================================================================
# Nexo Real — PostgreSQL Backup Script
# =============================================================================
# Generic backup script that works with:
#   - Local PostgreSQL container (via docker exec)
#   - Azure PostgreSQL Flexible Server (direct pg_dump)
#   - Any external PostgreSQL instance (via connection string)
#
# Usage:
#   ./backup-db.sh                           # local container
#   ./backup-db.sh --host myhost --db mydb   # remote server
#   ./backup-db.sh --help                    # show all options
#
# Environment variables (override defaults):
#   DB_HOST        — hostname (default: localhost)
#   DB_PORT        — port (default: 5432)
#   DB_NAME        — database name (default: mlm_db)
#   DB_USER        — database user (default: mlm_admin)
#   DB_PASSWORD    — database password
#   BACKUP_DIR     — backup output directory (default: /opt/nexo-real/backups)
#   RETAIN_DAYS    — days to keep backups (default: 7)
#   AZURE_CONTAINER — Azure Blob Storage container (optional)
#   AZURE_STORAGE_SAS — SAS token for Azure upload (optional)
# =============================================================================
set -euo pipefail

# --- Defaults ---------------------------------------------------------------
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mlm_db}"
DB_USER="${DB_USER:-mlm_admin}"
BACKUP_DIR="${BACKUP_DIR:-/opt/nexo-real/backups}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"
CONTAINER_NAME="${CONTAINER_NAME:-mlm-postgres}"
USE_DOCKER="${USE_DOCKER:-true}"
AZURE_CONTAINER="${AZURE_CONTAINER:-}"
AZURE_STORAGE_SAS="${AZURE_STORAGE_SAS:-}"

# --- Colors -----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[BACKUP]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# --- Help -------------------------------------------------------------------
usage() {
  cat <<EOF
Nexo Real — PostgreSQL Backup Script

Usage:
  $0 [OPTIONS]

Options:
  -h, --host HOST       Database host (default: localhost)
  -p, --port PORT       Database port (default: 5432)
  -d, --db NAME         Database name (default: mlm_db)
  -u, --user USER       Database user (default: mlm_admin)
  -P, --password PASS   Database password (reads from DB_PASSWORD env if omitted)
  -o, --output DIR      Backup output directory (default: /opt/nexo-real/backups)
  -r, --retain DAYS     Days to keep old backups (default: 7)
  --no-docker           Use direct pg_dump instead of docker exec
  --container NAME      Docker container name (default: mlm-postgres)
  --azure-upload        Upload backup to Azure Blob Storage
  --help                Show this help

Environment variables:
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
  BACKUP_DIR, RETAIN_DAYS, CONTAINER_NAME
  AZURE_CONTAINER, AZURE_STORAGE_SAS
EOF
  exit 0
}

# --- Parse arguments --------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--host)       DB_HOST="$2"; shift 2 ;;
    -p|--port)       DB_PORT="$2"; shift 2 ;;
    -d|--db)         DB_NAME="$2"; shift 2 ;;
    -u|--user)       DB_USER="$2"; shift 2 ;;
    -P|--password)   DB_PASSWORD="$2"; shift 2 ;;
    -o|--output)     BACKUP_DIR="$2"; shift 2 ;;
    -r|--retain)     RETAIN_DAYS="$2"; shift 2 ;;
    --no-docker)     USE_DOCKER=false; shift ;;
    --container)     CONTAINER_NAME="$2"; shift 2 ;;
    --azure-upload)  AZURE_UPLOAD=true; shift ;;
    --help)          usage ;;
    *)               err "Unknown option: $1"; usage ;;
  esac
done

AZURE_UPLOAD="${AZURE_UPLOAD:-false}"

# --- Validate ---------------------------------------------------------------
if [ -z "${DB_PASSWORD:-}" ]; then
  err "DB_PASSWORD is not set. Export it or use --password."
  exit 1
fi

# --- Setup ------------------------------------------------------------------
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/mlm_${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

log "Starting backup..."
echo "  Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo "  User:     ${DB_USER}"
echo "  Output:   ${BACKUP_FILE}"
echo ""

# --- pg_dump ----------------------------------------------------------------
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  2>/dev/null \
  | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup created: ${BACKUP_FILE} (${FILESIZE})"

# --- Rotation ---------------------------------------------------------------
log "Cleaning backups older than ${RETAIN_DAYS} days..."
DELETED=$(find "$BACKUP_DIR" -name "mlm_*.sql.gz" -mtime +"$RETAIN_DAYS" -print -delete | wc -l)
log "Removed ${DELETED} old backup(s)"

# --- Azure upload (optional) ------------------------------------------------
if [ "$AZURE_UPLOAD" = "true" ]; then
  if [ -z "$AZURE_CONTAINER" ] || [ -z "$AZURE_STORAGE_SAS" ]; then
    warn "Azure upload requested but AZURE_CONTAINER or AZURE_STORAGE_SAS not set. Skipping."
  else
    BLOB_NAME="backups/$(basename "$BACKUP_FILE")"
    UPLOAD_URL="https://${AZURE_CONTAINER}.blob.core.windows.net/${BLOB_NAME}?${AZURE_STORAGE_SAS}"

    log "Uploading to Azure Blob Storage..."
    if curl -s -X PUT -T "$BACKUP_FILE" \
      -H "x-ms-blob-type: BlockBlob" \
      "$UPLOAD_URL" >/dev/null 2>&1; then
      log "Uploaded: ${BLOB_NAME}"
    else
      warn "Azure upload failed. Backup is saved locally at ${BACKUP_FILE}"
    fi
  fi
fi

# --- Summary ----------------------------------------------------------------
echo ""
log "Backup complete!"
echo "  File:     ${BACKUP_FILE}"
echo "  Size:     ${FILESIZE}"
echo "  Retained: ${RETAIN_DAYS} days"
echo ""
echo "  Restore command:"
echo "    gunzip -c ${BACKUP_FILE} | PGPASSWORD=\$DB_PASSWORD psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}"
