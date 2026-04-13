/**
 * @fileoverview CRM Automation Widget component tests
 * @description Tests for PendingFollowUps, RecentActions, and CRMAutomationWidget components.
 *
 * ES: Tests para los componentes del widget de automatización CRM:
 *     PendingFollowUps, RecentActions, y CRMAutomationWidget.
 * EN: Tests for CRM automation widget components:
 *     PendingFollowUps, RecentActions, and CRMAutomationWidget.
 *
 * @module __tests__/CRMAutomationWidget
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ============================================
// Mocks / Mocks
// ============================================

const mockRefetch = vi.fn();

const { mockUseCRMAutomation } = vi.hoisted(() => ({
  mockUseCRMAutomation: vi.fn(),
}));

vi.mock('../hooks/useCRMAutomation', () => ({
  useCRMAutomation: mockUseCRMAutomation,
}));

// ============================================
// Test data / Datos de prueba
// ============================================

const baseHookResult = {
  status: {
    totalExecutions: 42,
    pendingFollowUps: 5,
    lastActionAt: '2026-04-12T14:00:00.000Z',
  },
  executions: [
    {
      id: 'exec-1',
      leadId: 'lead-1',
      workflowName: 'follow-up',
      actionType: 'email_sent',
      status: 'completed',
      n8nExecutionId: 'n8n-123',
      errorMessage: null,
      createdAt: '2026-04-12T14:00:00.000Z',
      Lead: { contactName: 'John Doe', contactPhone: '+5411123456' },
    },
    {
      id: 'exec-2',
      leadId: 'lead-2',
      workflowName: 'welcome-flow',
      actionType: 'whatsapp_sent',
      status: 'failed',
      n8nExecutionId: 'n8n-456',
      errorMessage: 'Timeout',
      createdAt: '2026-04-12T13:00:00.000Z',
      Lead: { contactName: 'Jane Smith', contactPhone: null },
    },
  ],
  total: 2,
  isLoading: false,
  error: null,
  refetch: mockRefetch,
};

// ============================================
// PendingFollowUps Tests
// ============================================

describe('PendingFollowUps', () => {
  beforeEach(() => vi.clearAllMocks());

  it('displays the pending follow-ups count from status', async () => {
    const { default: PendingFollowUps } = await import('../components/admin/PendingFollowUps');

    render(
      <PendingFollowUps
        pendingCount={5}
        totalExecutions={42}
        lastActionAt="2026-04-12T14:00:00.000Z"
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows zero values when no data is available', async () => {
    const { default: PendingFollowUps } = await import('../components/admin/PendingFollowUps');

    render(<PendingFollowUps pendingCount={0} totalExecutions={0} lastActionAt={null} />);

    // Should display "0" for both metrics
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================
// RecentActions Tests
// ============================================

describe('RecentActions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a list of recent execution records with lead names', async () => {
    const { default: RecentActions } = await import('../components/admin/RecentActions');

    render(<RecentActions executions={baseHookResult.executions} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows workflow name and action type for each execution', async () => {
    const { default: RecentActions } = await import('../components/admin/RecentActions');

    render(<RecentActions executions={baseHookResult.executions} />);

    expect(screen.getByText(/follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/email_sent/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome-flow/i)).toBeInTheDocument();
  });

  it('displays an empty state when there are no executions', async () => {
    const { default: RecentActions } = await import('../components/admin/RecentActions');

    render(<RecentActions executions={[]} />);

    expect(screen.getByText(/no.*actions|sin.*acciones/i)).toBeInTheDocument();
  });
});

// ============================================
// CRMAutomationWidget (Composition) Tests
// ============================================

describe('CRMAutomationWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCRMAutomation.mockReturnValue(baseHookResult);
  });

  it('renders loading skeleton when data is loading', async () => {
    mockUseCRMAutomation.mockReturnValue({
      ...baseHookResult,
      isLoading: true,
      status: null,
      executions: [],
    });

    const { default: CRMAutomationWidget } =
      await import('../components/admin/CRMAutomationWidget');

    render(<CRMAutomationWidget />);

    // Should show skeleton placeholders
    expect(screen.getByTestId('automation-widget-loading')).toBeInTheDocument();
  });

  it('renders status summary and recent actions when loaded', async () => {
    const { default: CRMAutomationWidget } =
      await import('../components/admin/CRMAutomationWidget');

    render(<CRMAutomationWidget />);

    // Status counts from PendingFollowUps
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    // Recent actions from RecentActions
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays an error message when the hook returns an error', async () => {
    mockUseCRMAutomation.mockReturnValue({
      ...baseHookResult,
      error: new Error('API failure'),
      status: null,
      executions: [],
    });

    const { default: CRMAutomationWidget } =
      await import('../components/admin/CRMAutomationWidget');

    render(<CRMAutomationWidget />);

    expect(screen.getByText(/error|API failure/i)).toBeInTheDocument();
  });

  it('calls refetch when the refresh button is clicked', async () => {
    const { default: CRMAutomationWidget } =
      await import('../components/admin/CRMAutomationWidget');

    render(<CRMAutomationWidget />);

    const refreshButton = screen.getByRole('button', { name: /refresh|actualizar/i });
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
