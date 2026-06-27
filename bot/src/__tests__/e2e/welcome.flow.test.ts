import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBot, createFlow, TestTool } from '@builderbot/bot';

// ─── Mock external dependencies ───────────────────────────────────────────────

vi.mock('../../services/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    alert: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/ai.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/ai.service.js')>();
  return {
    ...actual,
    aiService: {
      ...actual.aiService,
      chat: vi.fn(),
    },
  };
});

vi.mock('../../services/lead-persistence.service.js', () => ({
  leadPersistenceService: {
    saveLead: vi.fn(),
  },
}));

// Imports AFTER mocks
import { welcomeFlow } from '../../flows/welcome.flow.js';
import { aiService } from '../../services/ai.service.js';
import { logger } from '../../services/logger.js';
import { leadPersistenceService } from '../../services/lead-persistence.service.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { TestProvider, TestDB } = TestTool;

/** Bot responses = entries with non-empty options (excludes internal routing & user echoes) */
const getBotResponses = (history: { answer: string; options?: Record<string, unknown> }[]) =>
  history.filter(
    (a) =>
      a.options &&
      Object.keys(a.options).length > 0 &&
      !a.answer.includes('__call_action__') &&
      !a.answer.includes('__goto_flow__') &&
      !a.answer.includes('__end_flow__') &&
      !a.answer.includes('__capture_only_intended__')
  );

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PHONE = '5491100000001';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('welcomeFlow (E2E)', () => {
  let provider: InstanceType<typeof TestProvider>;
  let database: InstanceType<typeof TestDB>;

  vi.mocked(aiService.chat).mockResolvedValue({
    text: '¡Claro! Soy Sophia, tu asesora virtual. ¿En qué te puedo ayudar hoy?',
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    provider = new TestProvider();
    database = new TestDB();

    await createBot({
      database,
      provider,
      flow: createFlow([welcomeFlow]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Step 1 — Language Menu ───────────────────────────────────────────────

  it('shows language menu on first contact', async () => {
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Hola' });
    await delay(100);

    const answers = getBotResponses(database.listHistory).map((a) => a.answer);

    expect(answers).toHaveLength(1);
    expect(answers[0]).toContain('elegí tu idioma');
    expect(answers[0]).toContain('choose your language');
    expect(answers[0]).toContain('Español');
    expect(answers[0]).toContain('English');
  });

  // ─── Step 1 → 2 — Language Selection ──────────────────────────────────────

  it('validates language choice and rejects unknown input', async () => {
    // First message: triggers language menu
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Hola' });
    await delay(100);

    // Second message: invalid language choice
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'xyz' });
    await delay(100);

    const answers = getBotResponses(database.listHistory).map((a) => a.answer);

    // Language menu + error message
    expect(answers).toHaveLength(2);
    expect(answers[1]).toContain('No entendí tu elección');
    expect(answers[1]).toContain("I didn't catch that");
  });

  it('proceeds to name prompt after valid Spanish selection', async () => {
    // Message 1: language menu
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Hola' });
    await delay(100);

    // Message 2: select Spanish
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: '1' });
    await delay(100);

    const answers = getBotResponses(database.listHistory).map((a) => a.answer);

    // menu + confirmation + name prompt = 3
    expect(answers).toHaveLength(3);
    expect(answers[1]).toContain('Continuamos en español');
    expect(answers[2]).toContain('¿me decís tu nombre?');
  });

  it('proceeds to name prompt after valid English selection', async () => {
    // Message 1: language menu
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Hello' });
    await delay(100);

    // Message 2: select English
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: '2' });
    await delay(100);

    const answers = getBotResponses(database.listHistory).map((a) => a.answer);

    expect(answers).toHaveLength(3);
    expect(answers[1]).toContain("We'll continue in English");
    expect(answers[2]).toContain('tell me your name');
  });

  // ─── Step 2 → 3 — Name → Agent → Email ────────────────────────────────────

  it('assigns agent and asks for email after user provides name', async () => {
    // Message 1: language menu
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Hola' });
    await delay(100);

    // Message 2: select Spanish
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: '1' });
    await delay(100);

    // Message 3: provide name → triggers assignAgent
    // "Roberto" is not in FEMALE_NAMES → agent = Sophia
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Roberto' });
    await delay(200);

    const answers = getBotResponses(database.listHistory).map((a) => a.answer);

    // menu + confirmation + name prompt + agent intro + email prompt = 5
    expect(answers).toHaveLength(5);
    expect(answers[3]).toContain('Sophia');
    expect(answers[4]).toContain('email');
    expect(answers[4]).toContain('omitir');
  });

  // ─── Step 3 — Email Handling ──────────────────────────────────────────────

  it('skips email when user types omitir', async () => {
    // Step through to email prompt
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Hola' });
    await delay(100);
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: '1' });
    await delay(100);
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Roberto' });
    await delay(200);

    // Skip email
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'omitir' });
    await delay(100);

    const answers = getBotResponses(database.listHistory).map((a) => a.answer);

    // Last message should be area of interest menu
    const lastAnswer = answers[answers.length - 1];
    expect(lastAnswer).toContain('¿Qué es lo que más te interesa');
    expect(lastAnswer).toContain('Propiedades');
    expect(lastAnswer).toContain('Paquetes turísticos');
  });

  it('captures valid email and proceeds to area menu', async () => {
    // Step through to email prompt
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Hola' });
    await delay(100);
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: '1' });
    await delay(100);
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Roberto' });
    await delay(200);

    // Provide valid email
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'roberto@test.com' });
    await delay(100);

    const answers = getBotResponses(database.listHistory).map((a) => a.answer);

    // Last message should be area of interest menu
    const lastAnswer = answers[answers.length - 1];
    expect(lastAnswer).toContain('¿Qué es lo que más te interesa');
  });

  // ─── Step 4 → 5 — Full Happy Path ─────────────────────────────────────────

  it('completes full onboarding flow — Spanish, properties', async () => {
    // Step 1: First contact → language menu
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Hola' });
    await delay(100);

    // Step 2: Select Spanish
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: '1' });
    await delay(100);

    // Step 3: Provide name → agent assigned
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Roberto' });
    await delay(200);

    // Step 4: Skip email
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'omitir' });
    await delay(100);

    // Step 5: Select "Properties" (area of interest)
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: '1' });
    await delay(100);

    // Verify lead was saved
    expect(leadPersistenceService.saveLead).toHaveBeenCalledTimes(1);
    expect(leadPersistenceService.saveLead).toHaveBeenCalledWith({
      name: 'Roberto',
      phone: PHONE,
      email: undefined,
      areaOfInterest: 'properties',
      agentName: 'sophia',
      language: 'es',
      source: 'whatsapp_bot',
    });

    // Verify "ready for AI" message
    const answers = getBotResponses(database.listHistory).map((a) => a.answer);
    const readyMsg = answers[answers.length - 1];
    expect(readyMsg).toContain('Ahora sí');
    expect(readyMsg).toContain('Roberto');

    // Step 6: AI conversation
    await provider.delaySendMessage(0, 'message', {
      from: PHONE,
      body: '¿qué propiedades tienen?',
    });
    await delay(200);

    const answersAfter = getBotResponses(database.listHistory).map((a) => a.answer);
    const aiResponse = answersAfter[answersAfter.length - 1];
    expect(aiResponse).toContain('Claro');
    expect(aiService.chat).toHaveBeenCalledWith(PHONE, '¿qué propiedades tienen?', 'sophia', 'es');
  });

  // ─── Step 5 — AI Error Handling ───────────────────────────────────────────

  it('shows error message when AI service fails mid-conversation', async () => {
    // Step through the full onboarding
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Hola' });
    await delay(100);
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: '1' });
    await delay(100);
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'Roberto' });
    await delay(200);
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: 'omitir' });
    await delay(100);
    await provider.delaySendMessage(0, 'message', { from: PHONE, body: '1' });
    await delay(100);

    // Now mock aiService.chat to fail
    vi.mocked(aiService.chat).mockRejectedValueOnce(new Error('OpenAI API error'));

    // Send AI conversation message
    await provider.delaySendMessage(0, 'message', {
      from: PHONE,
      body: 'consulta sobre propiedades',
    });
    await delay(200);

    const answers = getBotResponses(database.listHistory).map((a) => a.answer);
    const errorResponse = answers[answers.length - 1];
    expect(errorResponse).toContain('problema técnico');
    expect(errorResponse).toContain('repetir tu mensaje');

    // Verify alert was logged
    expect(logger.alert).toHaveBeenCalledWith(
      'openai.failed',
      expect.objectContaining({
        phone: PHONE,
        agent: 'sophia',
      })
    );
  });
});
