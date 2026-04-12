/**
 * @fileoverview Component tests for Login page — 2FA detection flow
 * @description Tests for Login.tsx covering:
 *              - 2FA response → sessionStorage set + navigate to /login/2fa
 *              - Normal login response → login() called + navigate to /dashboard
 *              - Invalid credentials → error message displayed
 *
 *              Tests del componente Login cubriendo:
 *              - Respuesta 2FA → sessionStorage seteado + navegación a /login/2fa
 *              - Respuesta login normal → login() llamado + navegación a /dashboard
 *              - Credenciales inválidas → mensaje de error mostrado
 *
 * @module __tests__/pages/Login
 * @sprint Issue #156 — 2FA Frontend Fix
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock variables (hoisted) ──────────────────────────────────────────────────

const { mockNavigate, mockLogin, mockAuthServiceLogin } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogin: vi.fn(),
  mockAuthServiceLogin: vi.fn(),
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

/** authService mock — control login response */
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
    login: (...args: unknown[]) => mockAuthServiceLogin(...args),
    register: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

import Login from '../../pages/Login';
import type { AuthLoginResponse, Auth2FARequiredResponse } from '../../types';
import { TWO_FA_TEMP_TOKEN_KEY, TWO_FA_USER_ID_KEY } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Renders Login page inside a MemoryRouter.
 * Renderiza la página Login dentro de un MemoryRouter.
 */
function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

/**
 * Fills and submits the login form.
 * Completa y envía el formulario de login.
 */
async function fillAndSubmitForm(email = 'user@nexoreal.xyz', password = 'Password123!') {
  const emailInput = screen.getByPlaceholderText(/nombre@ejemplo/i);
  const passwordInput = screen.getByPlaceholderText(/••••/i);

  fireEvent.change(emailInput, { target: { value: email } });
  fireEvent.change(passwordInput, { target: { value: password } });

  const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
  fireEvent.click(submitButton);
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const normalLoginResponse: AuthLoginResponse = {
  token: 'jwt-token-abc123',
  user: {
    id: 'user-1',
    email: 'user@nexoreal.xyz',
    referralCode: 'REF001',
    level: 1,
    firstName: 'Test',
    lastName: 'User',
  },
};

const twoFAResponse: Auth2FARequiredResponse = {
  requires2FA: true,
  tempToken: 'temp-jwt-for-2fa',
  userId: 'user-2fa-1',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Login — 2FA detection flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // ── Scenario 1: Normal login ──────────────────────────────────────────────

  it('should call login() and navigate to /dashboard on normal login response', async () => {
    // Arrange
    mockAuthServiceLogin.mockResolvedValue(normalLoginResponse);

    renderLogin();

    // Act
    await fillAndSubmitForm();

    // Assert
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(normalLoginResponse.token, normalLoginResponse.user);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ── Scenario 2: 2FA required ──────────────────────────────────────────────

  it('should store tempToken/userId in sessionStorage and navigate to /login/2fa on 2FA response', async () => {
    // Arrange
    mockAuthServiceLogin.mockResolvedValue(twoFAResponse);

    renderLogin();

    // Act
    await fillAndSubmitForm();

    // Assert
    await waitFor(() => {
      // sessionStorage should have tempToken and userId
      expect(sessionStorage.getItem(TWO_FA_TEMP_TOKEN_KEY)).toBe('temp-jwt-for-2fa');
      expect(sessionStorage.getItem(TWO_FA_USER_ID_KEY)).toBe('user-2fa-1');

      // Should navigate to /login/2fa (NOT call login())
      expect(mockNavigate).toHaveBeenCalledWith('/login/2fa');
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  // ── Scenario 3: Invalid credentials ───────────────────────────────────────

  it('should display error message when login fails with invalid credentials', async () => {
    // Arrange — simulate a 401 error
    const axiosError = {
      response: {
        data: { message: 'Credenciales inválidas' },
      },
    };
    mockAuthServiceLogin.mockRejectedValue(axiosError);

    renderLogin();

    // Act
    await fillAndSubmitForm();

    // Assert — error message visible
    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    });

    // login() should NOT have been called
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ── Scenario 4: Fallback error message ────────────────────────────────────

  it('should display fallback i18n error when server error has no message', async () => {
    // Arrange — error without message field
    mockAuthServiceLogin.mockRejectedValue(new Error('Network error'));

    renderLogin();

    // Act
    await fillAndSubmitForm();

    // Assert — fallback message from i18n (auth.loginError → "Email o contraseña inválidos")
    await waitFor(() => {
      expect(screen.getByText('Email o contraseña inválidos')).toBeInTheDocument();
    });
  });
});
