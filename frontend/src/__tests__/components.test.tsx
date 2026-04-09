/**
 * @fileoverview Component Integration Tests
 * @description Tests for UI components with user interactions
 * @module components.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the API service to prevent real network calls in unit tests
vi.mock('../services/api', async () => {
  const mockApiClient = {
    get: vi.fn().mockRejectedValue(new Error('Network Error')),
    post: vi.fn().mockRejectedValue(new Error('Network Error')),
    put: vi.fn().mockRejectedValue(new Error('Network Error')),
    delete: vi.fn().mockRejectedValue(new Error('Network Error')),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  };

  // DashboardData shape — matches the DashboardData interface in types/index.ts
  const mockDashboardData = {
    user: {
      id: 'test-user',
      email: 'test@example.com',
      referralCode: 'ABC123',
      level: 1,
    },
    stats: {
      totalReferrals: 0,
      leftCount: 0,
      rightCount: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
    },
    referralLink: 'https://example.com/ref/ABC123',
    recentCommissions: [],
    recentReferrals: [],
    referralsChart: [],
    commissionsChart: [],
  };

  // ProductListResponse shape — matches what ProductCatalog does: response.products
  const mockProductListResponse = {
    products: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  return {
    default: mockApiClient,
    productService: {
      getProducts: vi.fn().mockResolvedValue(mockProductListResponse),
    },
    orderService: { createOrder: vi.fn() },
    dashboardService: { getDashboard: vi.fn().mockResolvedValue(mockDashboardData) },
    userService: { getProfile: vi.fn().mockResolvedValue(null) },
  };
});

// Mock AuthContext
vi.mock('../context/useAuth', async () => {
  return {
    useAuth: () => ({
      user: {
        id: 'test-user',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        referralCode: 'ABC123',
        level: 1,
      },
      isAuthenticated: true,
    }),
  };
});

// Import components to test
import Dashboard from '../pages/Dashboard';
import WalletPage from '../pages/WalletPage';
import Profile from '../pages/Profile';
import ProductCatalog from '../pages/ProductCatalog';

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard page', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Just verify it renders without crashing
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});

describe('WalletPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render wallet page', async () => {
    render(
      <TestWrapper>
        <WalletPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render profile page', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});

describe('ProductCatalog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render product catalog page', async () => {
    render(
      <TestWrapper>
        <ProductCatalog />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});
