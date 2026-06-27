import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBot, createFlow, TestTool } from '@builderbot/bot';
import { mlmApi, type BotProperty } from '../../services/mlm-api.service.js';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../services/mlm-api.service.js', () => ({
  mlmApi: {
    searchProperties: vi.fn(),
  },
}));

vi.mock('../../services/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), alert: vi.fn() },
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { propertiesFlow } from '../../flows/properties.flow.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { TestProvider, TestDB } = TestTool;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockProperties: BotProperty[] = [
  {
    id: 'prop-1',
    type: 'sale',
    title: 'Casa en Bogotá',
    price: 350000000,
    currency: 'COP',
    city: 'Bogotá',
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 120,
  },
  {
    id: 'prop-2',
    type: 'rental',
    title: 'Apartamento Medellín',
    price: 2500000,
    currency: 'COP',
    city: 'Medellín',
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 65,
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('propertiesFlow (E2E)', () => {
  let provider: InstanceType<typeof TestProvider>;
  let database: InstanceType<typeof TestDB>;

  beforeEach(async () => {
    vi.clearAllMocks();
    provider = new TestProvider();
    database = new TestDB();

    await createBot({
      database,
      provider,
      flow: createFlow([propertiesFlow]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows property list when search returns results', async () => {
    vi.mocked(mlmApi.searchProperties).mockResolvedValue(mockProperties);

    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'propiedades',
    });
    await delay(200);

    const answers = database.listHistory.map((a: any) => a.answer);
    const menu = answers.join(' ');

    expect(menu).toContain('Propiedades Disponibles');
    expect(menu).toContain('Casa en Bogotá');
    expect(menu).toContain('Apartamento Medellín');
    expect(menu).toContain('COP 350.000.000');
    expect(mlmApi.searchProperties).toHaveBeenCalledWith({ limit: 5 });
  });

  it('shows empty message when no properties are found', async () => {
    vi.mocked(mlmApi.searchProperties).mockResolvedValue([]);

    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'propiedades',
    });
    await delay(200);

    const answers = database.listHistory.map((a: any) => a.answer);
    const menu = answers.join(' ');

    expect(menu).toContain('No hay propiedades disponibles');
    expect(menu).toContain('nexoreal.xyz');
    expect(mlmApi.searchProperties).toHaveBeenCalledWith({ limit: 5 });
  });

  it('shows error message when API call fails', async () => {
    vi.mocked(mlmApi.searchProperties).mockRejectedValue(new Error('API error'));

    await provider.delaySendMessage(0, 'message', {
      from: '5491122334455',
      body: 'propiedades',
    });
    await delay(200);

    const answers = database.listHistory.map((a: any) => a.answer);
    const menu = answers.join(' ');

    expect(menu).toContain('No pude obtener las propiedades');
  });
});
