/**
 * @file n8n.service.ts
 * @description HTTP client for n8n webhook integrations.
 *
 * Nexo Bot calls n8n webhooks to trigger external automations:
 *   - /webhook/schedule-visit → Google Calendar + Notion CRM
 *   - /webhook/human-handoff  → Notion CRM (escalated) + agent notification
 *
 * n8n runs internally on the mlm-network — webhooks are NOT public.
 * Base URL is configured via N8N_WEBHOOK_URL env var.
 *
 * @author Nexo Real Development Team
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleVisitPayload {
  /** WhatsApp phone number (international format, e.g. "5491122334455") */
  phone: string;
  /** User's name as captured in the conversation */
  name: string;
  /** Preferred visit date (free text as typed by user, e.g. "martes 15 a las 10am") */
  preferredDate: string;
  /** Property or service of interest */
  interest: string;
  /** Conversation language */
  language: 'es' | 'en';
}

export interface HumanHandoffPayload {
  /** WhatsApp phone number */
  phone: string;
  /** User's name */
  name: string;
  /** Brief summary of why they need human attention */
  reason: string;
  /** Last AI agent assigned (sophia | max) */
  agent: string;
  /** Conversation language */
  language: 'es' | 'en';
  /** Timestamp of escalation */
  escalatedAt: string;
}

export interface N8nWebhookResult {
  success: boolean;
  error?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'http://n8n:5678/webhook';
const WEBHOOK_TIMEOUT_MS = 8000;

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function postWebhook<T>(path: string, payload: T): Promise<N8nWebhookResult> {
  const url = `${N8N_BASE_URL}/${path}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[n8n.service] Webhook ${path} failed: ${response.status} — ${body}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error(`[n8n.service] Webhook ${path} timed out after ${WEBHOOK_TIMEOUT_MS}ms`);
      return { success: false, error: 'timeout' };
    }
    console.error(`[n8n.service] Webhook ${path} error:`, err);
    return { success: false, error: err?.message || 'unknown' };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Trigger the "schedule visit" automation in n8n.
 * n8n will:
 *   1. Create a Google Calendar event with the preferred date
 *   2. Create / update a lead in Notion CRM with status "Visit Scheduled"
 */
export async function triggerScheduleVisit(
  payload: ScheduleVisitPayload
): Promise<N8nWebhookResult> {
  console.log(`[n8n.service] Triggering schedule-visit for ${payload.phone}`);
  return postWebhook('schedule-visit', payload);
}

/**
 * Trigger the "human handoff" automation in n8n.
 * n8n will:
 *   1. Update / create lead in Notion CRM with status "Needs Human"
 *   2. Send a WhatsApp notification to the assigned agent (via Meta API or Baileys)
 */
export async function triggerHumanHandoff(payload: HumanHandoffPayload): Promise<N8nWebhookResult> {
  console.log(`[n8n.service] Triggering human-handoff for ${payload.phone}`);
  return postWebhook('human-handoff', payload);
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const n8nService = {
  triggerScheduleVisit,
  triggerHumanHandoff,
};
