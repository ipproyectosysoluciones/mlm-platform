import { describe, it, expect, beforeEach } from 'vitest';
import { createBot, createFlow, TestTool } from '@builderbot/bot';
import { supportFlow } from '../../flows/support.flow.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { TestProvider, TestDB } = TestTool;

/** Filter out internal BuilderBot routing messages */
const parseAnswers = (history: { answer: string }[]) =>
  history.filter(
    (a) =>
      !a.answer.includes('__call_action__') &&
      !a.answer.includes('__goto_flow__') &&
      !a.answer.includes('__end_flow__') &&
      !a.answer.includes('__capture_only_intended__')
  );

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('supportFlow (E2E)', () => {
  let provider: InstanceType<typeof TestProvider>;
  let database: InstanceType<typeof TestDB>;

  beforeEach(async () => {
    provider = new TestProvider();
    database = new TestDB();

    await createBot({
      database,
      provider,
      flow: createFlow([supportFlow]),
    });
  });

  it('replies with the help menu when user sends "ayuda"', async () => {
    await provider.delaySendMessage(0, 'message', { from: '5491100000001', body: 'ayuda' });
    await delay(100);

    const answers = parseAnswers(database.listHistory).map((a) => a.answer);

    expect(answers).toHaveLength(1);
    expect(answers[0]).toContain('Opciones disponibles');
    expect(answers[0]).toContain('saldo');
    expect(answers[0]).toContain('ayuda');
  });

  it('reply contains the platform URL', async () => {
    await provider.delaySendMessage(0, 'message', { from: '5491100000002', body: 'ayuda' });
    await delay(100);

    const answers = parseAnswers(database.listHistory).map((a) => a.answer);
    expect(answers[0]).toContain('nexoreal.xyz');
  });
});
