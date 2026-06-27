import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAgentIntro, getAgentTransitionMessage } from '../../flows/agent.flow.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('agent.flow — getAgentIntro', () => {
  it('returns Sophia intro in Spanish for sophia + es', () => {
    const msg = getAgentIntro('sophia', 'es');
    expect(msg).toContain('Sophia');
    expect(msg).toContain('asesora virtual');
    expect(msg).toContain('Nexo Real');
  });

  it('returns Sophia intro in English for sophia + en', () => {
    const msg = getAgentIntro('sophia', 'en');
    expect(msg).toContain('Sophia');
    expect(msg).toContain('virtual advisor');
    expect(msg).toContain('Nexo Real');
  });

  it('returns Max intro in Spanish for max + es', () => {
    const msg = getAgentIntro('max', 'es');
    expect(msg).toContain('Max');
    expect(msg).toContain('asesor virtual');
    expect(msg).toContain('Nexo Real');
  });

  it('returns Max intro in English for max + en', () => {
    const msg = getAgentIntro('max', 'en');
    expect(msg).toContain('Max');
    expect(msg).toContain('virtual advisor');
    expect(msg).toContain('Nexo Real');
  });
});

describe('agent.flow — getAgentTransitionMessage', () => {
  it('returns transition to Max in Spanish', () => {
    const msg = getAgentTransitionMessage('max', 'es');
    expect(msg).toContain('Max');
    expect(msg).toContain('asesor');
  });

  it('returns transition to Max in English', () => {
    const msg = getAgentTransitionMessage('max', 'en');
    expect(msg).toContain('Max');
    expect(msg).toContain('specialized advisor');
  });

  it('returns transition to Sophia in Spanish', () => {
    const msg = getAgentTransitionMessage('sophia', 'es');
    expect(msg).toContain('Sophia');
    expect(msg).toContain('asesora');
  });

  it('returns transition to Sophia in English', () => {
    const msg = getAgentTransitionMessage('sophia', 'en');
    expect(msg).toContain('Sophia');
    expect(msg).toContain('advisor');
  });
});
