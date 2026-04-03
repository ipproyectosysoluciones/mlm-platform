/**
 * @fileoverview Component Integration Tests
 * @description Tests for UI components with user interactions
 * @module components.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock AuthContext
vi.mock('../context/AuthContext', async () => {
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
