/**
 * @fileoverview Component tests for TwoFactorLoginPage
 * @description Tests for TwoFactorLoginPage.tsx covering:
 *              - No tempToken in sessionStorage → redirect to /login
 *              - Valid TOTP code → verifyLogin + getUserWithToken + login() + clear + navigate /dashboard
 *              - Invalid TOTP code → error message, attempt counter
 *              - 5 failed attempts → lockout message, submit disabled
 *              - Expired token (401 on verify) → redirect to /login
 *
 *              Tests de TwoFactorLoginPage cubriendo:
 *              - Sin tempToken en sessionStorage → redirect a /login
 *              - Código TOTP válido → verifyLogin + getUserWithToken + login() + clear + navegar /dashboard
 *              - Código TOTP inválido → mensaje de error, contador de intentos
 *              - 5 intentos fallidos → mensaje de lockout, botón deshabilitado
 *              - Token expirado (401 en verify) → redirect a /login
 *
 * @module __tests__/pages/TwoFactorLoginPage
 * @sprint Issue #156 — 2FA Frontend Fix
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TWO_FA_TEMP_TOKEN_KEY, TWO_FA_USER_ID_KEY } from '../../types';
import type { User } from '../../types';

// ── Mock variables (hoisted) ──────────────────────────────────────────────────

const { mockNavigate, mockLogin, mockVerifyLogin, mockGetUserWithToken } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogin: vi.fn(),
  mockVerifyLogin: vi.fn(),
  mockGetUserWithToken: vi.fn(),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

/** react-router-dom — spy on useNavigate */
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/** Auth context mock — spy on login() */
vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    token: null,
    logout: vi.fn(),
  }),
}));

/** twoFactorService mock */
vi.mock('../../services/twoFactorService', () => ({
  default: {
    verifyLogin: (...args: unknown[]) => mockVerifyLogin(...args),
    getUserWithToken: (...args: unknown[]) => mockGetUserWithToken(...args),
  },
  twoFactorService: {
    verifyLogin: (...args: unknown[]) => mockVerifyLogin(...args),
    getUserWithToken: (...args: unknown[]) => mockGetUserWithToken(...args),
  },
}));

/** api mock — prevent real HTTP */
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

import TwoFactorLoginPage from '../../pages/TwoFactorLoginPage';

// ── Mock data ─────────────────────────────────────────────────────────────────

const TEMP_TOKEN = 'temp-jwt-for-2fa-login';
const USER_ID = 'user-2fa-1';

const mockUser: User = {
  id: USER_ID,
  email: 'user@nexoreal.xyz',
  referralCode: 'REF001',
  level: 1,
  firstName: 'Test',
  lastName: 'User',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sets up sessionStorage with valid 2FA temp data.
 * Configura sessionStorage con datos temporales 2FA válidos.
 */
function setSessionWith2FAData() {
  sessionStorage.setItem(TWO_FA_TEMP_TOKEN_KEY, TEMP_TOKEN);
  sessionStorage.setItem(TWO_FA_USER_ID_KEY, USER_ID);
}

/**
 * Renders TwoFactorLoginPage inside a MemoryRouter.
 * Renderiza TwoFactorLoginPage dentro de un MemoryRouter.
 */
function renderPage() {
  return render(
    <MemoryRouter>
      <TwoFactorLoginPage />
    </MemoryRouter>
  );
}

/**
 * Fills and submits the 2FA TOTP code form.
 * Completa y envía el formulario de código TOTP 2FA.
 */
async function submitCode(code = '123456') {
  const codeInput = screen.getByPlaceholderText(/000000/i);
  fireEvent.change(codeInput, { target: { value: code } });

  const submitButton = screen.getByRole('button', { name: /twoFactor\.loginVerify/i });
  fireEvent.click(submitButton);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TwoFactorLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // ── Scenario 1: No tempToken → redirect ─────────────────────────────────

  it('should redirect to /login when no tempToken in sessionStorage', async () => {
    // Arrange — sessionStorage is empty (cleared in beforeEach)

    // Act
    renderPage();

    // Assert — navigated to /login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  // ── Scenario 2: Valid TOTP code → full login flow ──────────────────────

  it('should complete login flow on valid TOTP code', async () => {
    // Arrange
    setSessionWith2FAData();
    mockVerifyLogin.mockResolvedValue({ verified: true });
    mockGetUserWithToken.mockResolvedValue(mockUser);

    renderPage();

    // Act
    await submitCode('654321');

    // Assert — full flow: verify → getUser → login → clear → navigate
    await waitFor(() => {
      // 1. verifyLogin called with code + tempToken
      expect(mockVerifyLogin).toHaveBeenCalledWith('654321', TEMP_TOKEN);

      // 2. getUserWithToken called with tempToken
      expect(mockGetUserWithToken).toHaveBeenCalledWith(TEMP_TOKEN);

      // 3. login() called with tempToken + user
      expect(mockLogin).toHaveBeenCalledWith(TEMP_TOKEN, mockUser);

      // 4. sessionStorage cleared
      expect(sessionStorage.getItem(TWO_FA_TEMP_TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(TWO_FA_USER_ID_KEY)).toBeNull();

      // 5. navigate to dashboard
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ── Scenario 3: Invalid TOTP code → error message ────────────────────

  it('should display error message and increment attempts on invalid TOTP code', async () => {
    // Arrange
    setSessionWith2FAData();
    const verifyError = {
      response: { status: 400, data: { message: 'Invalid code' } },
    };
    mockVerifyLogin.mockRejectedValue(verifyError);

    renderPage();

    // Act
    await submitCode('000000');

    // Assert — error message displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
    });

    // login() should NOT have been called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  // ── Scenario 4: 5 failed attempts → lockout ──────────────────────────

  it('should show lockout message and disable submit after 5 failed attempts', async () => {
    // Arrange
    setSessionWith2FAData();
    const verifyError = {
      response: { status: 400, data: { message: 'Invalid code' } },
    };
    mockVerifyLogin.mockRejectedValue(verifyError);

    renderPage();

    // Act — submit 5 times
    for (let i = 0; i < 5; i++) {
      await submitCode('000000');
      // Wait for the error to be processed before next attempt
      await waitFor(() => {
        expect(mockVerifyLogin).toHaveBeenCalledTimes(i + 1);
      });
    }

    // Assert — lockout: button disabled, lockout text visible
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /twoFactor\.loginVerify/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/twoFactor\.loginLockedOut/i)).toBeInTheDocument();
    });
  });

  // ── Scenario 5: Expired token (401) → redirect ───────────────────────

  it('should redirect to /login when token is expired (401 error)', async () => {
    // Arrange
    setSessionWith2FAData();
    const expiredError = {
      response: { status: 401, data: { message: 'Token expired' } },
    };
    mockVerifyLogin.mockRejectedValue(expiredError);

    renderPage();

    // Act
    await submitCode('123456');

    // Assert — redirected to /login, sessionStorage cleared
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(sessionStorage.getItem(TWO_FA_TEMP_TOKEN_KEY)).toBeNull();
    });
  });
});
