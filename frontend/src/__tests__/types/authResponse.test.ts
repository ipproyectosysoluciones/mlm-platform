/**
 * @fileoverview Tests for AuthResponse discriminated union and is2FARequired type guard
 * @description Validates the discriminated union types for 2FA login flow
 *              Valida los tipos de unión discriminada para el flujo de login 2FA
 * @module __tests__/types/authResponse.test
 */
import { describe, it, expect } from 'vitest';
import type { AuthLoginResponse, Auth2FARequiredResponse, AuthResponse } from '../../types';
import { is2FARequired } from '../../types';

describe('is2FARequired type guard', () => {
  it('should return false for a normal login response (token + user)', () => {
    const response: AuthLoginResponse = {
      token: 'jwt-token-abc',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        referralCode: 'REF123',
        level: 1,
      },
    };

    expect(is2FARequired(response)).toBe(false);
  });

  it('should return true for a 2FA required response', () => {
    const response: Auth2FARequiredResponse = {
      requires2FA: true,
      tempToken: 'temp-jwt-abc',
      userId: 'user-2',
    };

    expect(is2FARequired(response)).toBe(true);
  });

  it('should return false when requires2FA field is missing (edge case)', () => {
    // Simulates a response without requires2FA — should be treated as normal login
    const response = {
      token: 'jwt-token-xyz',
      user: {
        id: 'user-3',
        email: 'other@example.com',
        referralCode: 'REF456',
        level: 2,
      },
    } as AuthResponse;

    expect(is2FARequired(response)).toBe(false);
  });

  it('should return false when requires2FA is explicitly false', () => {
    // Edge case: object has requires2FA but it is false
    const response = {
      requires2FA: false,
      tempToken: 'some-token',
      userId: 'user-4',
    } as unknown as AuthResponse;

    expect(is2FARequired(response)).toBe(false);
  });
});
