import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBot, createFlow, TestTool } from '@builderbot/bot';

// ─── Mock external dependencies ───────────────────────────────────────────────

vi.mock('../../services/mlm-api.service.js', () => ({
  mlmApi: {
    getUserByPhone: vi.fn(),
    getWalletBalance: vi.fn(),
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

// Imports AFTER mocks are declared
import { balanceFlow } from '../../flows/balance.flow.js';
import { mlmApi } from '../../services/mlm-api.service.js';
import type { UserProfile, WalletBalance } from '../../services/mlm-api.service.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { TestProvider, TestDB } = TestTool;

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

const mockWallet: WalletBalance = {
  balance: 1500.5,
  pendingWithdrawals: 200,
  totalEarned: 3000,
  currency: 'USD',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('balanceFlow (E2E)', () => {
  let provider: InstanceType<typeof TestProvider>;
  let database: InstanceType<typeof TestDB>;

  beforeEach(async () => {
    vi.clearAllMocks();
    provider = new TestProvider();
    database = new TestDB();

    await createBot({
      database,
      provider,
      flow: createFlow([balanceFlow]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows wallet balance when user and wallet are found', async () => {
    vi.mocked(mlmApi.getUserByPhone).mockResolvedValue(mockUser);
    vi.mocked(mlmApi.getWalletBalance).mockResolvedValue(mockWallet);

    await provider.delaySendMessage(0, 'message', { from: '5491122334455', body: 'saldo' });
    await delay(200);

    const answers = parseAnswers(database.listHistory).map((a) => a.answer);

    expect(answers).toHaveLength(1);
    expect(answers[0]).toContain('Tu Wallet');
    expect(answers[0]).toContain('USD');
    expect(answers[0]).toContain('1.500,50'); // es-AR locale formatting
  });

  it('shows "not found" message when user does not exist', async () => {
    vi.mocked(mlmApi.getUserByPhone).mockResolvedValue(null);

    await provider.delaySendMessage(0, 'message', { from: '5490000000000', body: 'saldo' });
    await delay(200);

    const answers = parseAnswers(database.listHistory).map((a) => a.answer);

    expect(answers).toHaveLength(1);
    expect(answers[0]).toContain('No encontré una cuenta');
    expect(mlmApi.getWalletBalance).not.toHaveBeenCalled();
  });

  it('shows error message when wallet API returns null', async () => {
    vi.mocked(mlmApi.getUserByPhone).mockResolvedValue(mockUser);
    vi.mocked(mlmApi.getWalletBalance).mockResolvedValue(null);

    await provider.delaySendMessage(0, 'message', { from: '5491122334455', body: 'saldo' });
    await delay(200);

    const answers = parseAnswers(database.listHistory).map((a) => a.answer);

    expect(answers).toHaveLength(1);
    expect(answers[0]).toContain('No pude obtener tu saldo');
  });
});
