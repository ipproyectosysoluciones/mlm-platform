import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

// ─── Imports (no mocks needed — nock intercepts at the HTTP level) ────────────

import { leadPersistenceService } from '../../services/lead-persistence.service.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockLeadData = {
  phone: '5491122334455',
  name: 'Juan Test',
  agentName: 'sophia',
  language: 'es',
  source: 'whatsapp',
};

const BACKEND_URL = 'http://localhost:3000';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('lead-persistence.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
    vi.restoreAllMocks();
  });

  it('posts lead data to the backend with correct headers', async () => {
    const scope = nock(BACKEND_URL)
      .post('/bot/leads', (body) => {
        expect(body).toEqual(mockLeadData);
        return true;
      })
      .matchHeader('Content-Type', 'application/json')
      .matchHeader('x-bot-secret', 'test-secret')
      .reply(201, { ok: true });

    await leadPersistenceService.saveLead(mockLeadData);

    expect(scope.isDone()).toBe(true);
  });

  it('does not throw when the API call fails (network error)', async () => {
    // Don't intercept — let it fail with ECONNREFUSED naturally
    // Or use nock to simulate a network error by intercepting and aborting
    nock(BACKEND_URL).post('/bot/leads').replyWithError(new Error('Network error'));

    await expect(leadPersistenceService.saveLead(mockLeadData)).resolves.toBeUndefined();
  });

  it('does not throw when the API returns an error status', async () => {
    nock(BACKEND_URL).post('/bot/leads').reply(400, { message: 'Invalid data' });

    await expect(leadPersistenceService.saveLead(mockLeadData)).resolves.toBeUndefined();
  });
});
