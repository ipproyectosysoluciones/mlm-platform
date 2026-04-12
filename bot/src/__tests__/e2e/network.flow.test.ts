import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBot, createFlow, TestTool } from '@builderbot/bot';

// ─── Mock external dependencies BEFORE importing the flow ─────────────────────

vi.mock('../../services/mlm-api.service.js', () => ({
  mlmApi: {
    getUserByPhone: vi.fn(),
    getWalletBalance: vi.fn(),
    getNetworkSummary: vi.fn(),
    getRecentCommissions: vi.fn(),
  },
}));

vi.mock('../../services/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    alert: vi.fn().mockResolvedValue(undefined),
  },
}));

// ─── Imports AFTER mocks ───────────────────────────────────────────────────────

import { networkFlow } from '../../flows/network.flow.js';
import { mlmApi } from '../../services/mlm-api.service.js';
import type { UserProfile, NetworkSummary, Commission } from '../../services/mlm-api.service.js';

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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser: UserProfile = {
  id: 'user-uuid-123',
  username: 'juantest',
  email: 'juan@test.com',
  firstName: 'Juan',
  lastName: 'Test',
  phone: '5491122334455',
  role: 'member',
};

const mockNetwork: NetworkSummary = {
  totalReferrals: 15,
  activeReferrals: 8,
  leftLeg: 5,
  rightLeg: 3,
  level: 3,
};

const mockCommissions: Commission[] = [
  {
    amount: 150.0,
    type: 'direct',
    description: 'Direct sale',
    createdAt: '2026-03-01T10:00:00Z',
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('networkFlow (E2E)', () => {
  let provider: InstanceType<typeof TestProvider>;
  let database: InstanceType<typeof TestDB>;

  beforeEach(async () => {
    vi.clearAllMocks();
    provider = new TestProvider();
    database = new TestDB();

    await createBot({
      database,
      provider,
      flow: createFlow([networkFlow]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows network summary when user and network data are found', async () => {
    vi.mocked(mlmApi.getUserByPhone).mockResolvedValue(mockUser);
    vi.mocked(mlmApi.getNetworkSummary).mockResolvedValue(mockNetwork);
    vi.mocked(mlmApi.getRecentCommissions).mockResolvedValue(mockCommissions);

    await provider.delaySendMessage(0, 'message', { from: '5491122334455', body: 'mi red' });
    await delay(200);

    const answers = parseAnswers(database.listHistory).map((a) => a.answer);

    expect(answers).toHaveLength(1);
    expect(answers[0]).toContain('Tu Red');
    expect(answers[0]).toContain('15'); // totalReferrals
    expect(answers[0]).toContain('8'); // activeReferrals
    expect(answers[0]).toContain('5'); // leftLeg
    expect(answers[0]).toContain('3'); // rightLeg (level also 3, both appear)
    expect(answers[0]).toContain('nexoreal.xyz');
  });

  it('shows commission entries in the summary when commissions are present', async () => {
    vi.mocked(mlmApi.getUserByPhone).mockResolvedValue(mockUser);
    vi.mocked(mlmApi.getNetworkSummary).mockResolvedValue(mockNetwork);
    vi.mocked(mlmApi.getRecentCommissions).mockResolvedValue(mockCommissions);

    await provider.delaySendMessage(0, 'message', { from: '5491122334455', body: 'red' });
    await delay(200);

    const answers = parseAnswers(database.listHistory).map((a) => a.answer);

    expect(answers).toHaveLength(1);
    expect(answers[0]).toContain('Últimas comisiones');
    expect(answers[0]).toContain('direct');
  });

  it('shows "not found" message when user does not exist', async () => {
    vi.mocked(mlmApi.getUserByPhone).mockResolvedValue(null);

    await provider.delaySendMessage(0, 'message', { from: '5490000000000', body: 'mi red' });
    await delay(200);

    const answers = parseAnswers(database.listHistory).map((a) => a.answer);

    expect(answers).toHaveLength(1);
    expect(answers[0]).toContain('No encontré una cuenta');
    expect(mlmApi.getNetworkSummary).not.toHaveBeenCalled();
  });

  it('shows error message when network API returns null', async () => {
    vi.mocked(mlmApi.getUserByPhone).mockResolvedValue(mockUser);
    vi.mocked(mlmApi.getNetworkSummary).mockResolvedValue(null);

    await provider.delaySendMessage(0, 'message', { from: '5491122334455', body: 'mi red' });
    await delay(200);

    const answers = parseAnswers(database.listHistory).map((a) => a.answer);

    expect(answers).toHaveLength(1);
    expect(answers[0]).toContain('No pude obtener tu red');
    expect(mlmApi.getRecentCommissions).not.toHaveBeenCalled();
  });
});
