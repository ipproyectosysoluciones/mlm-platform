/**
 * @fileoverview useCRMAutomation hook unit tests
 * @description Tests for the CRM automation polling hook (60s interval, cleanup on unmount).
 *
 * ES: Tests para el hook de polling de automatización CRM (intervalo 60s, limpieza en unmount).
 * EN: Tests for the CRM automation polling hook (60s interval, cleanup on unmount).
 *
 * Strategy: We avoid vi.useFakeTimers() because waitFor() from @testing-library/react
 * uses real timers internally for its polling. Instead, we spy on setInterval/clearInterval
 * to assert polling setup and cleanup, and let promises resolve naturally.
 *
 * @module __tests__/useCRMAutomation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ============================================
// Mocks / Mocks
// ============================================

const { mockGetAutomationStatus, mockGetAutomationExecutions } = vi.hoisted(() => ({
  mockGetAutomationStatus: vi.fn(),
  mockGetAutomationExecutions: vi.fn(),
}));

vi.mock('../services/crmService', () => ({
  crmService: {
    getAutomationStatus: mockGetAutomationStatus,
    getAutomationExecutions: mockGetAutomationExecutions,
  },
}));

import { useCRMAutomation } from '../hooks/useCRMAutomation';

// ============================================
// Test data / Datos de prueba
// ============================================

const mockStatus = {
  totalExecutions: 42,
  pendingFollowUps: 5,
  lastActionAt: '2026-04-12T14:00:00.000Z',
};

const mockExecutions = {
  data: [
    {
      id: 'exec-1',
      leadId: 'lead-1',
      workflowName: 'follow-up',
      actionType: 'email_sent',
      status: 'completed',
      n8nExecutionId: 'n8n-123',
      errorMessage: null,
      createdAt: '2026-04-12T14:00:00.000Z',
      Lead: { contactName: 'John Doe', contactPhone: '+54111234567' },
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

// ============================================
// Tests
// ============================================

describe('useCRMAutomation', () => {
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setIntervalSpy = vi.spyOn(global, 'setInterval');
    clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    mockGetAutomationStatus.mockResolvedValue(mockStatus);
    mockGetAutomationExecutions.mockResolvedValue(mockExecutions);
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('fetches status and executions on mount', async () => {
    const { result } = renderHook(() => useCRMAutomation());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).toEqual(mockStatus);
    expect(result.current.executions).toEqual(mockExecutions.data);
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();

    expect(mockGetAutomationStatus).toHaveBeenCalledTimes(1);
    expect(mockGetAutomationExecutions).toHaveBeenCalledTimes(1);
  });

  it('sets up a 60-second polling interval on mount', async () => {
    const { result } = renderHook(() => useCRMAutomation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify setInterval was called with a 60s interval
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000);
  });

  it('cleans up interval on unmount', async () => {
    const { result, unmount } = renderHook(() => useCRMAutomation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Capture the interval ID that was created
    const intervalId = setIntervalSpy.mock.results[0]?.value;
    expect(intervalId).toBeDefined();

    unmount();

    // clearInterval should have been called with the same interval ID
    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
  });

  it('handles API errors gracefully', async () => {
    mockGetAutomationStatus.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCRMAutomation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
    // Status should remain null on error
    expect(result.current.status).toBeNull();
  });

  it('exposes a refetch function that reloads data on demand', async () => {
    const { result } = renderHook(() => useCRMAutomation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetAutomationStatus).toHaveBeenCalledTimes(1);

    // Trigger manual refetch with updated data
    const updatedStatus = { ...mockStatus, pendingFollowUps: 10 };
    mockGetAutomationStatus.mockResolvedValue(updatedStatus);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.status?.pendingFollowUps).toBe(10);
    expect(mockGetAutomationStatus).toHaveBeenCalledTimes(2);
  });
});
