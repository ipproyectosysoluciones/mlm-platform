/**
 * @fileoverview CampaignDashboard Component Tests
 * @description Unit tests for the campaign dashboard — list, tabs, create, monitor, retry.
 *              Tests unitarios del dashboard de campañas — lista, tabs, crear, monitorear, reintentar.
 * @module __tests__/components/CampaignDashboard.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CampaignDashboard } from '../../components/EmailCampaigns/CampaignDashboard';
import type { EmailCampaign } from '../../types';

// ============================================
// Mock Data / Datos de prueba
// ============================================

const mockCampaigns: EmailCampaign[] = [
  {
    id: 'camp-1',
    name: 'March Newsletter',
    emailTemplateId: 'tpl-1',
    status: 'completed',
    scheduledFor: null,
    startedAt: '2026-03-01T10:00:00.000Z',
    completedAt: '2026-03-01T10:15:00.000Z',
    recipientSegment: 'all_users',
    recipientCount: 100,
    sentCount: 98,
    failedCount: 2,
    deferredCount: 0,
    bounceCount: 0,
    openCount: 45,
    clickCount: 12,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T10:15:00.000Z',
  },
  {
    id: 'camp-2',
    name: 'Welcome Email',
    emailTemplateId: 'tpl-2',
    status: 'draft',
    scheduledFor: null,
    startedAt: null,
    completedAt: null,
    recipientSegment: 'new_users',
    recipientCount: 0,
    sentCount: 0,
    failedCount: 0,
    deferredCount: 0,
    bounceCount: 0,
    openCount: 0,
    clickCount: 0,
    createdAt: '2026-04-01T09:00:00.000Z',
    updatedAt: '2026-04-01T09:00:00.000Z',
  },
];

// ============================================
// Mocks
// ============================================

const mockFetchCampaigns = vi.fn();
const mockSetActiveTab = vi.fn();
const mockClearErrors = vi.fn();
const mockCreateCampaign = vi.fn();

let mockStoreState = {
  campaigns: mockCampaigns,
  activeTab: 'all' as const,
  isLoading: false,
  isCreatingCampaign: false,
  error: null as string | null,
  campaignError: null as string | null,
  fetchCampaigns: mockFetchCampaigns,
  createCampaign: mockCreateCampaign,
  setActiveTab: mockSetActiveTab,
  clearErrors: mockClearErrors,
};

vi.mock('../../stores/emailCampaignStore', () => ({
  useEmailCampaigns: () => mockStoreState,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('CampaignDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {
      campaigns: mockCampaigns,
      activeTab: 'all' as const,
      isLoading: false,
      isCreatingCampaign: false,
      error: null,
      campaignError: null,
      fetchCampaigns: mockFetchCampaigns,
      createCampaign: mockCreateCampaign,
      setActiveTab: mockSetActiveTab,
      clearErrors: mockClearErrors,
    };
  });

  it('should render the dashboard with campaign list', () => {
    render(
      <TestWrapper>
        <CampaignDashboard />
      </TestWrapper>
    );

    expect(screen.getByTestId('campaign-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-card-camp-1')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-card-camp-2')).toBeInTheDocument();
    expect(screen.getByText('March Newsletter')).toBeInTheDocument();
    expect(screen.getByText('Welcome Email')).toBeInTheDocument();
  });

  it('should render status tabs for filtering', () => {
    render(
      <TestWrapper>
        <CampaignDashboard />
      </TestWrapper>
    );

    expect(screen.getByTestId('tab-all')).toBeInTheDocument();
    expect(screen.getByTestId('tab-draft')).toBeInTheDocument();
    expect(screen.getByTestId('tab-scheduled')).toBeInTheDocument();
    expect(screen.getByTestId('tab-sending')).toBeInTheDocument();
    expect(screen.getByTestId('tab-completed')).toBeInTheDocument();
  });

  it('should call onCreateCampaign when "New Campaign" button is clicked', () => {
    const onCreateCampaign = vi.fn();

    render(
      <TestWrapper>
        <CampaignDashboard onCreateCampaign={onCreateCampaign} />
      </TestWrapper>
    );

    const createBtn = screen.getByTestId('create-campaign-btn');
    fireEvent.click(createBtn);

    expect(onCreateCampaign).toHaveBeenCalledTimes(1);
  });

  it('should call onSelectCampaign when a campaign card is clicked', () => {
    const onSelectCampaign = vi.fn();

    render(
      <TestWrapper>
        <CampaignDashboard onSelectCampaign={onSelectCampaign} />
      </TestWrapper>
    );

    const campaignCard = screen.getByTestId('campaign-card-camp-1');
    fireEvent.click(campaignCard);

    expect(onSelectCampaign).toHaveBeenCalledWith(mockCampaigns[0]);
  });

  it('should show loading state when isLoading is true', () => {
    mockStoreState = {
      ...mockStoreState,
      isLoading: true,
      campaigns: [],
    };

    render(
      <TestWrapper>
        <CampaignDashboard />
      </TestWrapper>
    );

    expect(screen.getByTestId('campaigns-loading')).toBeInTheDocument();
  });

  it('should show empty state when there are no campaigns', () => {
    mockStoreState = {
      ...mockStoreState,
      campaigns: [],
    };

    render(
      <TestWrapper>
        <CampaignDashboard />
      </TestWrapper>
    );

    expect(screen.getByTestId('campaigns-empty')).toBeInTheDocument();
  });

  it('should show error alert when there is an error', () => {
    mockStoreState = {
      ...mockStoreState,
      error: 'Failed to fetch campaigns',
    };

    render(
      <TestWrapper>
        <CampaignDashboard />
      </TestWrapper>
    );

    expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch campaigns')).toBeInTheDocument();
  });

  it('should fetch campaigns on mount', () => {
    render(
      <TestWrapper>
        <CampaignDashboard />
      </TestWrapper>
    );

    expect(mockFetchCampaigns).toHaveBeenCalledTimes(1);
  });

  it('should display campaign stats (recipients, sent, delivery rate)', () => {
    render(
      <TestWrapper>
        <CampaignDashboard />
      </TestWrapper>
    );

    // The March Newsletter has 100 recipients, 98 sent → 98.0% delivery
    expect(screen.getByText('100 recipients')).toBeInTheDocument();
    expect(screen.getByText('98 sent')).toBeInTheDocument();
    expect(screen.getByText('98.0%')).toBeInTheDocument();
  });
});
