/**
 * @fileoverview Tests for twoFactorService — verifyLogin and getUserWithToken
 * @description Validates the 2FA login verification and user retrieval with temp token
 *              Valida la verificación de login 2FA y la obtención de usuario con token temporal
 * @module __tests__/services/twoFactorService.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mocks — vi.hoisted ensures variables are available when vi.mock factory runs
// ============================================

const { mockApiGet, mockApiPost } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: mockApiGet,
    post: mockApiPost,
  },
}));

// ============================================
// Import AFTER mock declaration
// ============================================

import { twoFactorService } from '../../services/twoFactorService';

// ============================================
// T-003: verifyLogin(code, tempToken)
// ============================================

describe('twoFactorService.verifyLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should POST to /auth/2fa/verify with code in body and tempToken as Bearer header', async () => {
    const mockResponse = {
      data: { success: true, data: { verified: true } },
    };
    mockApiPost.mockResolvedValueOnce(mockResponse);

    await twoFactorService.verifyLogin('123456', 'temp-jwt-token');

    expect(mockApiPost).toHaveBeenCalledTimes(1);
    expect(mockApiPost).toHaveBeenCalledWith(
      '/auth/2fa/verify',
      { code: '123456' },
      { headers: { Authorization: 'Bearer temp-jwt-token' } }
    );
  });

  it('should return the verification data on success', async () => {
    const mockResponse = {
      data: { success: true, data: { verified: true } },
    };
    mockApiPost.mockResolvedValueOnce(mockResponse);

    const result = await twoFactorService.verifyLogin('654321', 'another-temp-token');

    expect(result).toEqual({ verified: true });
  });

  it('should propagate errors from the API call', async () => {
    const apiError = new Error('Network Error');
    mockApiPost.mockRejectedValueOnce(apiError);

    await expect(twoFactorService.verifyLogin('000000', 'bad-token')).rejects.toThrow(
      'Network Error'
    );
  });
});

// ============================================
// T-004: getUserWithToken(tempToken)
// ============================================

describe('twoFactorService.getUserWithToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should GET /auth/me with tempToken as Bearer header', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      referralCode: 'REF123',
      level: 1,
    };
    const mockResponse = {
      data: { success: true, data: mockUser },
    };
    mockApiGet.mockResolvedValueOnce(mockResponse);

    await twoFactorService.getUserWithToken('temp-jwt-token');

    expect(mockApiGet).toHaveBeenCalledTimes(1);
    expect(mockApiGet).toHaveBeenCalledWith('/auth/me', {
      headers: { Authorization: 'Bearer temp-jwt-token' },
    });
  });

  it('should return the user data on success', async () => {
    const mockUser = {
      id: 'user-2',
      email: 'other@example.com',
      referralCode: 'REF456',
      level: 3,
      firstName: 'Juan',
      lastName: 'Pérez',
    };
    const mockResponse = {
      data: { success: true, data: mockUser },
    };
    mockApiGet.mockResolvedValueOnce(mockResponse);

    const result = await twoFactorService.getUserWithToken('some-temp-token');

    expect(result).toEqual(mockUser);
  });

  it('should propagate errors from the API call', async () => {
    const apiError = new Error('Unauthorized');
    mockApiGet.mockRejectedValueOnce(apiError);

    await expect(twoFactorService.getUserWithToken('expired-token')).rejects.toThrow(
      'Unauthorized'
    );
  });
});
