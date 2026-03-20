import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import TreeView from '../pages/TreeView';

const mockDashboardData = {
  stats: {
    totalReferrals: 5,
    totalEarnings: 100.50,
    pendingEarnings: 25.00,
    leftCount: 3,
    rightCount: 2,
  },
  referralLink: 'https://mlm.com/ref/ABC123',
  recentCommissions: [],
  recentReferrals: [],
};

const mockProfileData = {
  id: 'user-123',
  email: 'test@example.com',
  referralCode: 'ABC123',
  level: 1,
  sponsor: { id: 'sponsor-1', referralCode: 'SPONSOR1' },
  createdAt: new Date('2024-01-01'),
};

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
    updateProfile: vi.fn().mockResolvedValue({}),
    changePassword: vi.fn().mockResolvedValue({}),
    deleteAccount: vi.fn().mockResolvedValue({}),
  },
  dashboardService: {
    getDashboard: vi.fn(),
  },
  treeService: {
    getMyTree: vi.fn(),
    getTree: vi.fn(),
  },
}));

import { authService, dashboardService, treeService } from '../services/api';

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

  it('renders login form', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
  });

  it('shows link to register', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('has sign in button', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form', () => {
    render(
      <TestWrapper>
        <Register />
      </TestWrapper>
    );

    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
  });

  it('shows sponsor code field', () => {
    render(
      <TestWrapper>
        <Register />
      </TestWrapper>
    );

    expect(screen.getByText(/sponsor code/i)).toBeInTheDocument();
  });

  it('shows link to login', () => {
    render(
      <TestWrapper>
        <Register />
      </TestWrapper>
    );

    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('has create account button', () => {
    render(
      <TestWrapper>
        <Register />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });
});

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  it('renders dashboard', async () => {
    (dashboardService.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/mlm dashboard/i)).toBeInTheDocument();
    });
  });

  it('displays stats', async () => {
    (dashboardService.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/total referrals/i)).toBeInTheDocument();
      expect(screen.getByText(/total earnings/i)).toBeInTheDocument();
    });
  });

  it('has profile link', async () => {
    (dashboardService.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });
  });

  it('has tree view link', async () => {
    (dashboardService.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboardData);

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/view full tree/i)).toBeInTheDocument();
    });
  });
});

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  it('renders profile page', async () => {
    (authService.getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockProfileData });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/back to dashboard/i)).toBeInTheDocument();
    });
  });

  it('shows referral code', async () => {
    (authService.getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockProfileData });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/abc123/i)).toBeInTheDocument();
    });
  });

  it('shows account settings', async () => {
    (authService.getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockProfileData });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/account settings/i)).toBeInTheDocument();
    });
  });
});

describe('TreeView Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  it('renders tree view', async () => {
    (treeService.getMyTree as ReturnType<typeof vi.fn>).mockResolvedValue(mockTreeData);

    render(
      <TestWrapper>
        <TreeView />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/binary tree/i)).toBeInTheDocument();
    });
  });

  it('has depth controls', async () => {
    (treeService.getMyTree as ReturnType<typeof vi.fn>).mockResolvedValue(mockTreeData);

    render(
      <TestWrapper>
        <TreeView />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/depth: 3/i)).toBeInTheDocument();
    });
  });

  it('has back to dashboard link', async () => {
    (treeService.getMyTree as ReturnType<typeof vi.fn>).mockResolvedValue(mockTreeData);

    render(
      <TestWrapper>
        <TreeView />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/back/i)).toBeInTheDocument();
    });
  });
});
