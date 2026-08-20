/**
 * @fileoverview Dashboard unit tests
 * @description Tests for the Dashboard page component: loading, error, loaded states,
 *              QR toggle, referral copy, and isMounted timer.
 *              Tests real sub-components (StatsCards, Charts, CommissionTierBreakdown, RecentActivity).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// Mock only API and qrcode — render real sub-components for coverage
vi.mock('../services/api', () => ({
  dashboardService: {
    getDashboard: vi.fn(),
  },
  // Default export is the axios client used by MercadoPagoConnectCard (B11)
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: { status: 'never' } } }),
    post: vi.fn().mockResolvedValue({ data: { success: true, data: { status: 'disconnected' } } }),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@example.com', referralCode: 'ABC123', level: 1 },
    token: 'token',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock('qrcode', () => ({
  default: { toCanvas: vi.fn().mockResolvedValue(undefined) },
}));

// Recharts uses canvas/SVG measurement — we provide a basic container mock via setup.ts (ResizeObserver)
// The Dashboard suppresses recharts width/height warnings via console.warn override.

import Dashboard from '../pages/Dashboard';
import { dashboardService } from '../services/api';
import { useAuth } from '../context/useAuth';
import type { Commission, Referral } from '../types';

const mockCommissions: Commission[] = [
  {
    id: 'comm-1',
    type: 'direct',
    amount: 150,
    currency: 'USD',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    fromUser: { email: 'referrer1@test.com', referralCode: 'REF001' },
  },
  {
    id: 'comm-2',
    type: 'level_2',
    amount: 75,
    currency: 'USD',
    createdAt: new Date('2025-01-11T12:00:00Z'),
    fromUser: { email: 'referrer2@test.com', referralCode: 'REF002' },
  },
];

const mockReferrals: Referral[] = [
  {
    id: 'ref-1',
    email: 'newuser@test.com',
    position: 'left',
    createdAt: new Date('2025-01-12T08:00:00Z'),
  },
  {
    id: 'ref-2',
    email: 'another@test.com',
    position: 'right',
    createdAt: new Date('2025-01-13T09:00:00Z'),
  },
];

const mockDashboardData = {
  user: { id: 'user-1', email: 'test@example.com', referralCode: 'ABC123', level: 1 },
  stats: {
    totalReferrals: 8,
    leftCount: 5,
    rightCount: 3,
    totalEarnings: 2500,
    pendingEarnings: 350,
  },
  referralLink: 'https://example.com/ref/ABC123',
  recentCommissions: mockCommissions,
  recentReferrals: mockReferrals,
  referralsChart: [
    { month: 'Nov', count: 3 },
    { month: 'Dec', count: 5 },
    { month: 'Jan', count: 2 },
  ],
  commissionsChart: [
    { month: 'Nov', amount: 400 },
    { month: 'Dec', amount: 700 },
    { month: 'Jan', amount: 500 },
  ],
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the useAuth mock implementation so the vendor-role override set in
    // the "renders the MercadoPago connect card for vendor role" test (which calls
    // vi.mocked(useAuth).mockReturnValue({...role:'vendor'})) does not bleed into
    // the non-vendor test via mockReturnValue persistence. clearAllMocks does NOT
    // reset mock implementations, so without this the non-vendor case still sees
    // role === 'vendor' and renders the MercadoPagoConnectCard, failing its
    // `not.toBeInTheDocument` assertion. (B11 / FE-1 — fixes pre-existing leak)
    vi.mocked(useAuth).mockReset();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', referralCode: 'ABC123', level: 1 },
      token: 'token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
  });

  // ==========================================
  // Loading state
  // ==========================================

  it('shows loading spinner initially', () => {
    vi.mocked(dashboardService.getDashboard).mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  // ==========================================
  // Error state
  // ==========================================

  it('shows error message when data fetch fails', async () => {
    vi.mocked(dashboardService.getDashboard).mockRejectedValue(new Error('API Error'));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Loaded state — full data
  // ==========================================

  it('renders dashboard with data after successful fetch', async () => {
    vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    });

    // Stats section
    expect(screen.getByText('8')).toBeInTheDocument(); // totalReferrals
    expect(screen.getByText('$2500.00')).toBeInTheDocument(); // totalEarnings
    expect(screen.getByText('$350.00')).toBeInTheDocument(); // pendingEarnings

    // Referral link section
    expect(screen.getByDisplayValue('https://example.com/ref/ABC123')).toBeInTheDocument();

    // Network stats
    expect(screen.getByText('5')).toBeInTheDocument(); // leftCount
    expect(screen.getByText('3')).toBeInTheDocument(); // rightCount

    // View Full Tree link
    expect(screen.getByRole('link', { name: /Ver Árbol Completo/ })).toBeInTheDocument();
  });

  it('renders RecentActivity with commissions and referrals', async () => {
    vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    });

    // Commission items rendered
    expect(screen.getByText('referrer1@test.com')).toBeInTheDocument();
    expect(screen.getByText('referrer2@test.com')).toBeInTheDocument();

    // Referral items rendered
    expect(screen.getByText('newuser@test.com')).toBeInTheDocument();
    expect(screen.getByText('another@test.com')).toBeInTheDocument();
  });

  it('renders CommissionTierBreakdown table with tier data', async () => {
    vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    });

    // Commission breakdown section should render
    expect(screen.getByText('Desglose de Comisiones')).toBeInTheDocument();

    // Tier rate values should be in the table (from MOCK_TIER_DATA fallback)
    // Level 1: 10%, Level 2: 5%, etc.
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  // ==========================================
  // Referral link copy
  // ==========================================

  it('copies referral link to clipboard on copy button click', async () => {
    vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    });

    // The copy button is the first <button> — it's icon-only (no accessible name)
    const buttons = screen.getAllByRole('button');
    const copyBtn = buttons[0]; // Copy button before QR toggle
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/ref/ABC123');
  });

  // ==========================================
  // QR toggle
  // ==========================================

  it('shows QR code after clicking toggle', async () => {
    vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    });

    const qrBtn = screen.getByRole('button', { name: /Mostrar QR/ });
    fireEvent.click(qrBtn);

    // Real QRDisplay renders the referral code text after showing QR
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('hides QR code when toggling off', async () => {
    vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    });

    // Show QR
    const showBtn = screen.getByRole('button', { name: /Mostrar QR/ });
    fireEvent.click(showBtn);
    expect(screen.getByText('ABC123')).toBeInTheDocument();

    // Hide QR
    const hideBtn = screen.getByRole('button', { name: /Ocultar QR/ });
    fireEvent.click(hideBtn);
    expect(screen.queryByText('ABC123')).not.toBeInTheDocument();
  });

  // ==========================================
  // isMounted timer (setTimeout coverage)
  // ==========================================

  it('sets isMounted after 500ms timeout', async () => {
    vi.useFakeTimers();
    vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);
    renderDashboard();

    // Flush promises so data loads (setTimeout is mocked so isMounted stays false)
    await act(async () => {});

    // Data loaded — CommissionTierBreakdown heading is always rendered
    expect(screen.getByText('Desglose de Comisiones')).toBeInTheDocument();

    // Advance past the 500ms timer to trigger isMounted
    act(() => {
      vi.advanceTimersByTime(500);
    });

    vi.useRealTimers();
  });

  // ==========================================
  // Vendor role — MercadoPago connect card (B11 / FE-1)
  // ==========================================

  it('renders the MercadoPago connect card for vendor role', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'vendor-1',
        email: 'vendor@test.com',
        referralCode: 'VND001',
        level: 1,
        role: 'vendor',
      },
      token: 'token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);

    renderDashboard();

    expect(await screen.findByText('vendor.mpConnect.title')).toBeInTheDocument();
  });

  it('does not render the MercadoPago connect card for non-vendor roles', async () => {
    vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    });
    expect(screen.queryByText('vendor.mpConnect.title')).not.toBeInTheDocument();
  });
});
