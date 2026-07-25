#!/bin/bash
# ============================================
# Nexo Real — Healthcheck & Alert System
# ============================================
# Usage: ./healthcheck.sh
# Cron:  */5 * * * * /path/to/healthcheck.sh >> /var/log/mlm-healthcheck.log 2>&1
#
# Checks:
#   1. Docker containers running
#   2. Health endpoints (local + external)
#   3. Disk usage
#   4. Memory usage
#
# Alerts: Telegram + Email (Brevo)

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.monitoring"

# Load environment
if [[ -f "$ENV_FILE" ]]; then
    source "$ENV_FILE"
else
    echo "[$(date -Iseconds)] ERROR: .env.monitoring not found at $ENV_FILE"
    exit 1
fi

# ── State file (avoid spam) ──────────────────────────────────────
STATE_FILE="/tmp/mlm-healthcheck-state"
LAST_ALERT_FILE="/tmp/mlm-healthcheck-last-alert"

# ── Helpers ──────────────────────────────────────────────────────
log() {
    echo "[$(date -Iseconds)] $1"
}

send_telegram() {
    local message="$1"
    if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=${message}" \
            -d "parse_mode=Markdown" \
            --max-time 10 > /dev/null 2>&1 || true
    fi
}

send_email() {
    local subject="$1"
    local body="$2"
    if [[ -n "${BREVO_API_KEY:-}" && -n "${ALERT_EMAIL_TO:-}" ]]; then
        curl -s -X POST "https://api.brevo.com/v3/smtp/email" \
            -H "api-key: ${BREVO_API_KEY}" \
            -H "Content-Type: application/json" \
            -d "{
                \"sender\": {\"name\": \"Nexo Real Monitor\", \"email\": \"${ALERT_EMAIL_FROM:-noreply@nexoreal.xyz}\"},
                \"to\": [{\"email\": \"${ALERT_EMAIL_TO}\"}],
                \"subject\": \"${subject}\",
                \"htmlContent\": \"<p>${body}</p>\"
            }" --max-time 10 > /dev/null 2>&1 || true
    fi
}

send_alert() {
    local severity="$1"
    local title="$2"
    local details="$3"
    local message="🚨 *${severity}: ${title}*

${details}

🕐 $(date '+%Y-%m-%d %H:%M:%S')
🖥️ $(hostname)"

    log "ALERT [$severity]: $title — $details"
    send_telegram "$message"
    send_email "[$severity] $title" "$details"
}

send_recovery() {
    local title="$1"
    local message="✅ *RECOVERED: ${title}*

All checks passing again.

🕐 $(date '+%Y-%m-%d %H:%M:%S')
🖥️ $(hostname)"

    log "RECOVERY: $title"
    send_telegram "$message"
    send_email "[RECOVERED] $title" "All checks passing again."
}

# ── Checks ───────────────────────────────────────────────────────
ERRORS=()
WARNINGS=()

# 1. Container check
check_containers() {
    local containers=("mlm-backend-1" "mlm-bot-1" "mlm-postgres-1" "mlm-n8n-1" "mlm-redis-1")
    for container in "${containers[@]}"; do
        local status
        status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
        if [[ "$status" != "running" ]]; then
            ERRORS+=("Container *${container}* is ${status}")
        fi
    done
}

# 2. Health endpoint check
check_endpoints() {
    local timeout="${HEALTH_CHECK_TIMEOUT:-10}"

    # Local backend
    local local_status
    local_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" http://localhost:3000/api/v1/health 2>/dev/null || echo "000")
    if [[ "$local_status" != "200" ]]; then
        ERRORS+=("Backend health endpoint (local) returned HTTP ${local_status}")
    fi

    # External backend
    local ext_status
    ext_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" https://api.nexoreal.xyz/api/v1/health 2>/dev/null || echo "000")
    if [[ "$ext_status" != "200" ]]; then
        WARNINGS+=("Backend health endpoint (external) returned HTTP ${ext_status}")
    fi

    # n8n (should redirect to Cloudflare Access = 302)
    local n8n_status
    n8n_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" https://n8n.nexoreal.xyz/ 2>/dev/null || echo "000")
    if [[ "$n8n_status" != "302" && "$n8n_status" != "200" ]]; then
        WARNINGS+=("n8n endpoint returned HTTP ${n8n_status} (expected 302)")
    fi
}

# 3. Disk check
DISK_USAGE=0
check_disk() {
    DISK_USAGE=$(df /mnt/docker-data --output=pcent | tail -1 | tr -d ' %')
    local available
    available=$(df -h /mnt/docker-data --output=avail | tail -1 | tr -d ' ')

    if [[ "$DISK_USAGE" -ge "${DISK_CRIT_PERCENT:-90}" ]]; then
        ERRORS+=("Disk usage CRITICAL: ${DISK_USAGE}% used (${available} free)")
    elif [[ "$DISK_USAGE" -ge "${DISK_WARN_PERCENT:-80}" ]]; then
        WARNINGS+=("Disk usage HIGH: ${DISK_USAGE}% used (${available} free)")
    fi
}

# 4. Memory check
MEM_USAGE=0
check_memory() {
    MEM_USAGE=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')

    if [[ "$MEM_USAGE" -ge "${MEMORY_WARN_PERCENT:-85}" ]]; then
        WARNINGS+=("Memory usage HIGH: ${MEM_USAGE}%")
    fi
}

# ── Main ─────────────────────────────────────────────────────────
main() {
    log "Starting healthcheck..."

    check_containers
    check_endpoints
    check_disk
    check_memory

    # Determine previous state
    local prev_state="ok"
    [[ -f "$STATE_FILE" ]] && prev_state=$(cat "$STATE_FILE")

    # Report results
    if [[ ${#ERRORS[@]} -gt 0 ]]; then
        echo "critical" > "$STATE_FILE"

        local error_text=$(printf "%s\n" "${ERRORS[@]}")
        send_alert "CRITICAL" "Nexo Real Healthcheck Failed" "$error_text"

        if [[ ${#WARNINGS[@]} -gt 0 ]]; then
            local warn_text=$(printf "%s\n" "${WARNINGS[@]}")
            log "Additional warnings: $warn_text"
        fi

        log "Healthcheck FAILED with ${#ERRORS[@]} critical error(s) and ${#WARNINGS[@]} warning(s)"
        exit 1

    elif [[ ${#WARNINGS[@]} -gt 0 ]]; then
        echo "warning" > "$STATE_FILE"

        local warn_text=$(printf "%s\n" "${WARNINGS[@]}")
        send_alert "WARNING" "Nexo Real Healthcheck Warning" "$warn_text"

        log "Healthcheck WARNING: ${#WARNINGS[@]} warning(s)"
        exit 0

    else
        echo "ok" > "$STATE_FILE"

        # Send recovery if previously failing
        if [[ "$prev_state" == "critical" ]]; then
            send_recovery "All systems operational"
        fi

        log "Healthcheck OK — all containers running, endpoints healthy, disk ${DISK_USAGE}%, memory ${MEM_USAGE}%"
        exit 0
    fi
}

main "$@"
