import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveLanguageFromInput } from '../../flows/language.flow.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('language.flow — resolveLanguageFromInput', () => {
  const mockState = { update: vi.fn() };
  const mockFlowDynamic = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns "es" for Spanish keyword "español" and updates state', async () => {
    const result = await resolveLanguageFromInput('español', mockState, mockFlowDynamic);

    expect(result).toBe('es');
    expect(mockState.update).toHaveBeenCalledWith({ lang: 'es', awaitingLanguage: false });
    expect(mockFlowDynamic).toHaveBeenCalledWith([{ body: expect.stringContaining('español') }]);
  });

  it('returns "es" for "1" (menu option)', async () => {
    const result = await resolveLanguageFromInput('1', mockState, mockFlowDynamic);
    expect(result).toBe('es');
  });

  it('returns "en" for English keyword "english"', async () => {
    const result = await resolveLanguageFromInput('english', mockState, mockFlowDynamic);

    expect(result).toBe('en');
    expect(mockState.update).toHaveBeenCalledWith({ lang: 'en', awaitingLanguage: false });
    expect(mockFlowDynamic).toHaveBeenCalledWith([{ body: expect.stringContaining('English') }]);
  });

  it('returns "en" for "2" (menu option)', async () => {
    const result = await resolveLanguageFromInput('2', mockState, mockFlowDynamic);
    expect(result).toBe('en');
  });

  it('returns null for unrecognized input', async () => {
    const result = await resolveLanguageFromInput('xyz', mockState, mockFlowDynamic);

    expect(result).toBeNull();
    expect(mockState.update).not.toHaveBeenCalled();
    expect(mockFlowDynamic).not.toHaveBeenCalled();
  });

  it('handles leading/trailing whitespace', async () => {
    const result = await resolveLanguageFromInput('  español  ', mockState, mockFlowDynamic);
    expect(result).toBe('es');
  });

  it('handles case-insensitive input', async () => {
    const result = await resolveLanguageFromInput('ES', mockState, mockFlowDynamic);
    expect(result).toBe('es');
  });
});
