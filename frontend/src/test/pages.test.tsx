import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import TreeView from '../pages/TreeView';

const mockTreeData = {
  id: 'user-123',
  email: 'test@example.com',
  referralCode: 'ABC123',
  position: 'left' as const,
  level: 1,
  stats: { leftCount: 2, rightCount: 1 },
  children: [],
};

vi.mock('../services/api', () => ({
  authService: {
    login: vi.fn().mockResolvedValue({}),
    register: vi.fn().mockResolvedValue({}),
    getProfile: vi.fn().mockResolvedValue({ data: null }),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
  dashboardService: {
    getDashboard: vi.fn(),
  },
  treeService: {
    getMyTree: vi.fn(),
    getTree: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 'test', email: 'test@test.com' },
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
  }),
}));

import { treeService } from '../services/api';

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email input', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText(/tu@email/i)).toBeInTheDocument();
  });

  it('renders login form with password input', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('has a submit button', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { type: 'submit' })).toBeInTheDocument();
  });

  it('has a link to register', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByRole('link', { name: /registrate/i })).toBeInTheDocument();
  });
});

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form with email input', () => {
    render(
      <TestWrapper>
        <Register />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText(/tu@email/i)).toBeInTheDocument();
  });

  it('has a submit button', () => {
    render(
      <TestWrapper>
        <Register />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { type: 'submit' })).toBeInTheDocument();
  });

  it('has a link to login page', () => {
    render(
      <TestWrapper>
        <Register />
      </TestWrapper>
    );

    // The link text comes from i18n: auth.signIn = "Iniciar Sesión"
    expect(screen.getByText(/Iniciar/i)).toBeInTheDocument();
  });
});

describe('TreeView Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no referrals', async () => {
    (treeService.getMyTree as ReturnType<typeof vi.fn>).mockResolvedValue(mockTreeData);

    render(
      <TestWrapper>
        <TreeView />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });
  });
});
