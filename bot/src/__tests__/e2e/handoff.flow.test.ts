import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBot, createFlow, TestTool } from '@builderbot/bot';
import { n8nService } from '../../services/n8n.service.js';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../services/n8n.service.js', () => ({
  n8nService: {
    triggerHumanHandoff: vi.fn(),
  },
}));

vi.mock('../../services/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), alert: vi.fn() },
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { handoffFlow } from '../../flows/handoff.flow.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { TestProvider, TestDB } = TestTool;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const parseAnswers = (history: { answer: string }[]) =>
  history.filter(
    (a) =>
      !a.answer.includes('__call_action__') &&
      !a.answer.includes('__goto_flow__') &&
      !a.answer.includes('__end_flow__') &&
      !a.answer.includes('__capture_only_intended__')
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('handoffFlow (E2E)', () => {
  let provider: InstanceType<typeof TestProvider>;
  let database: InstanceType<typeof TestDB>;

  beforeEach(async () => {
    vi.clearAllMocks();
    provider = new TestProvider();
    database = new TestDB();

    await createBot({
      database,
      provider,
      flow: createFlow([handoffFlow]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('acknowledges the user and fires the n8n handoff webhook', async () => {
    // Mock n8n to resolve quickly
    vi.mocked(n8nService.triggerHumanHandoff).mockResolvedValue({ success: true });

    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'hablar con un asesor',
    });
    await delay(400); // Slightly longer — handoff has an async .then() chain

    const answers = parseAnswers(database.listHistory).map((a: any) => a.answer);
    const all = answers.join(' ');

    // The flow should acknowledge immediately
    expect(all).toContain('Entendido');
    expect(all).toContain('asesor');
    expect(all).toContain('Nexo Real');

    // n8n should have been called (async, but within the delay)
    expect(n8nService.triggerHumanHandoff).toHaveBeenCalledTimes(1);
    expect(n8nService.triggerHumanHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '5491122334455',
        agentName: 'sophia',
        language: 'es',
      })
    );
  });

  it('still acknowledges the user even when n8n fails (async fire-and-forget)', async () => {
    vi.mocked(n8nService.triggerHumanHandoff).mockResolvedValue({
      success: false,
      error: 'Webhook error',
    });

    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'hablar con un asesor',
    });
    await delay(400);

    const answers = parseAnswers(database.listHistory).map((a: any) => a.answer);
    const all = answers.join(' ');

    // The acknowledgment is always sent BEFORE the async webhook
    expect(all).toContain('Entendido');
  });

  it('uses the complete user message as the conversation summary', async () => {
    vi.mocked(n8nService.triggerHumanHandoff).mockResolvedValue({ success: true });

    // The user's message is both the trigger keyword AND the summary
    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'speak to a human — I need help with my account',
    });
    await delay(400);

    // n8n should receive the full body as the summary
    expect(n8nService.triggerHumanHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'speak to a human — I need help with my account',
      })
    );
  });
});
