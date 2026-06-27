import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBot, createFlow, TestTool } from '@builderbot/bot';
import { mlmApi, type BotTour } from '../../services/mlm-api.service.js';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../services/mlm-api.service.js', () => ({
  mlmApi: {
    searchTours: vi.fn(),
  },
}));

vi.mock('../../services/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), alert: vi.fn() },
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { toursFlow } from '../../flows/tours.flow.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { TestProvider, TestDB } = TestTool;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockTours: BotTour[] = [
  {
    id: 'tour-1',
    type: 'adventure',
    title: 'Cartagena Weekend',
    destination: 'Cartagena',
    price: 1800000,
    currency: 'COP',
    durationDays: 3,
    maxCapacity: 15,
  },
  {
    id: 'tour-2',
    type: 'cultural',
    title: 'Eje Cafetero Experience',
    destination: 'Salento',
    price: 2500000,
    currency: 'COP',
    durationDays: 5,
    maxCapacity: 10,
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('toursFlow (E2E)', () => {
  let provider: InstanceType<typeof TestProvider>;
  let database: InstanceType<typeof TestDB>;

  beforeEach(async () => {
    vi.clearAllMocks();
    provider = new TestProvider();
    database = new TestDB();

    await createBot({
      database,
      provider,
      flow: createFlow([toursFlow]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows tour list when search returns results', async () => {
    vi.mocked(mlmApi.searchTours).mockResolvedValue(mockTours);

    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'tours',
    });
    await delay(200);

    const answers = database.listHistory.map((a: any) => a.answer);
    const menu = answers.join(' ');

    expect(menu).toContain('Tours Disponibles');
    expect(menu).toContain('Cartagena Weekend');
    expect(menu).toContain('Eje Cafetero Experience');
    expect(menu).toContain('3 días');
    expect(mlmApi.searchTours).toHaveBeenCalledWith({ limit: 5 });
  });

  it('shows empty message when no tours are found', async () => {
    vi.mocked(mlmApi.searchTours).mockResolvedValue([]);

    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'tours',
    });
    await delay(200);

    const answers = database.listHistory.map((a: any) => a.answer);
    const menu = answers.join(' ');

    expect(menu).toContain('No hay tours disponibles');
    expect(menu).toContain('nexoreal.xyz');
    expect(mlmApi.searchTours).toHaveBeenCalledWith({ limit: 5 });
  });

  it('shows error message when API call fails', async () => {
    vi.mocked(mlmApi.searchTours).mockRejectedValue(new Error('API error'));

    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'tours',
    });
    await delay(200);

    const answers = database.listHistory.map((a: any) => a.answer);
    const menu = answers.join(' ');

    expect(menu).toContain('No pude obtener los tours');
  });
});
