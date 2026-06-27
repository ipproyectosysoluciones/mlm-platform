import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBot, createFlow, TestTool } from '@builderbot/bot';
import { mlmApi, type BotReservation, type UserProfile } from '../../services/mlm-api.service.js';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../services/mlm-api.service.js', () => ({
  mlmApi: {
    getUserByPhone: vi.fn(),
    getReservations: vi.fn(),
  },
}));

vi.mock('../../services/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), alert: vi.fn() },
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { reservationsFlow } from '../../flows/reservations.flow.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { TestProvider, TestDB } = TestTool;

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

const mockReservations: BotReservation[] = [
  {
    id: 'res-1',
    type: 'property',
    status: 'confirmed',
    paymentStatus: 'paid',
    totalPrice: 120000000,
    currency: 'COP',
    checkIn: '2026-07-15',
    checkOut: '2026-08-15',
    createdAt: '2026-06-10T12:00:00Z',
    groupSize: 1,
  },
  {
    id: 'res-2',
    type: 'tour',
    status: 'pending',
    paymentStatus: 'pending',
    totalPrice: 1800000,
    currency: 'COP',
    tourDate: '2026-08-20',
    createdAt: '2026-06-12T12:00:00Z',
    groupSize: 4,
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('reservationsFlow (E2E)', () => {
  let provider: InstanceType<typeof TestProvider>;
  let database: InstanceType<typeof TestDB>;

  beforeEach(async () => {
    vi.clearAllMocks();
    provider = new TestProvider();
    database = new TestDB();

    await createBot({
      database,
      provider,
      flow: createFlow([reservationsFlow]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows reservation list when user is found and has reservations', async () => {
    vi.mocked(mlmApi.getUserByPhone).mockResolvedValue(mockUser);
    vi.mocked(mlmApi.getReservations).mockResolvedValue(mockReservations);

    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'mis reservas',
    });
    await delay(200);

    const answers = database.listHistory.map((a: any) => a.answer);
    const menu = answers.join(' ');

    expect(menu).toContain('Tus últimas reservas');
    expect(menu).toContain('Propiedad');
    expect(menu).toContain('Confirmada');
    expect(menu).toContain('Tour');
    expect(menu).toContain('Pendiente');
    expect(menu).toContain('Check-in');
    expect(menu).toContain('Personas');
    expect(mlmApi.getUserByPhone).toHaveBeenCalledWith('5491122334455');
    expect(mlmApi.getReservations).toHaveBeenCalledWith('user-uuid-123', { limit: 5 });
  });

  it('shows empty message when user has no reservations', async () => {
    vi.mocked(mlmApi.getUserByPhone).mockResolvedValue(mockUser);
    vi.mocked(mlmApi.getReservations).mockResolvedValue([]);

    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'mis reservas',
    });
    await delay(200);

    const answers = database.listHistory.map((a: any) => a.answer);
    const menu = answers.join(' ');

    expect(menu).toContain('No tenés reservas registradas');
    expect(menu).toContain('nexoreal.xyz');
  });

  it('shows registration prompt when user is not found by phone', async () => {
    vi.mocked(mlmApi.getUserByPhone).mockResolvedValue(null);

    await provider.delaySendMessage(0, 'message', {
      from: '5490000000000',
      body: 'mis reservas',
    });
    await delay(200);

    const answers = database.listHistory.map((a: any) => a.answer);
    const menu = answers.join(' ');

    expect(menu).toContain('No encontré una cuenta');
    expect(menu).toContain('/register');
    expect(mlmApi.getReservations).not.toHaveBeenCalled();
  });
});
