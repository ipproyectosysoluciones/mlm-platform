/**
 * @fileoverview Custom Hooks Unit Tests
 * @description Tests for custom React hooks
 * @module hooks.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useData, useRefetchableData } from '../hooks/useData';
import { useAuth } from '../context/useAuth';
import { useTreeStore } from '../stores/treeStore';
import { useWalletStore } from '../stores/walletStore';

// Mock the API services
vi.mock('../services/api', () => ({
  authService: {
    getProfile: vi.fn(),
  },
  userService: {
    getUserDetails: vi.fn(),
  },
  treeService: {
    getMyTree: vi.fn(),
  },
  walletService: {
    getBalance: vi.fn(),
    getTransactions: vi.fn(),
  },
}));

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      referralCode: 'ABC123',
      level: 1,
    },
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('useData hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data on mount', async () => {
    const mockData = { id: 1, name: 'Test' };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useData({ fetcher }));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });
    expect(fetcher).toHaveBeenCalled();
  });

  it('should handle error state', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useData({ fetcher }));

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  it('should handle loading state', async () => {
    let resolveFetcher: (value: any) => void;
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetcher = resolve;
        })
    );

    const { result } = renderHook(() => useData({ fetcher }));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveFetcher!({ id: 1 });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should refetch data', async () => {
    const mockData = { id: 1, name: 'Test' };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useData({ fetcher }));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    const newData = { id: 2, name: 'New Test' };
    fetcher.mockResolvedValue(newData);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual(newData);
  });

  it('should use fallback data', async () => {
    const fallback = { id: 0, name: 'Fallback' };
    const fetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useData({ fetcher, fallback }));

    await waitFor(() => {
      expect(result.current.data).toEqual(fallback);
    });
  });

  it('should handle cleanup on unmount', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 1 }), 100))
      );

    const { unmount } = renderHook(() => useData({ fetcher }));

    // Unmount before promise resolves
    unmount();

    // Should not throw even if promise resolves after unmount
    await new Promise((resolve) => setTimeout(resolve, 150));
  });
});

describe('useRefetchableData hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data on mount with deps', async () => {
    const mockData = { id: 1, name: 'Test' };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useRefetchableData(fetcher, []));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });
  });

  it('should refetch when deps change', async () => {
    const mockData = { id: 1, name: 'Test' };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result, rerender } = renderHook(({ dep }) => useRefetchableData(fetcher, [dep]), {
      initialProps: { dep: 1 },
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    const newData = { id: 2, name: 'New Test' };
    fetcher.mockResolvedValue(newData);

    rerender({ dep: 2 });

    await waitFor(() => {
      expect(result.current.data).toEqual(newData);
    });
  });

  it('should expose loading state during refetch', async () => {
    const mockData = { id: 1, name: 'Test' };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useRefetchableData(fetcher, []));

    // Initial fetch - should have no data but loading
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return auth context values', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('token');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
  });

  it('should have authenticated user', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({
      id: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      referralCode: 'ABC123',
      level: 1,
    });
  });

  it('should have login and logout functions', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });
});

describe('useTreeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { result } = renderHook(() => useTreeStore());
    act(() => {
      result.current.reset();
    });
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useTreeStore());

    expect(result.current.tree).toBeNull();
    expect(result.current.selectedNodeId).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should update tree state', () => {
    const { result } = renderHook(() => useTreeStore());
    const mockTree = {
      id: 'test',
      email: 'test@test.com',
      referralCode: 'ABC',
      position: 'left' as const,
      level: 1,
      stats: { leftCount: 0, rightCount: 0 },
      children: [],
    };

    act(() => {
      result.current.setTree(mockTree as any);
    });

    expect(result.current.tree).toEqual(mockTree);
  });

  it('should handle search', () => {
    const { result } = renderHook(() => useTreeStore());

    act(() => {
      result.current.setSearchQuery('test query');
    });

    expect(result.current.searchQuery).toBe('test query');
  });
});

describe('useWalletStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.reset();
    });
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useWalletStore());

    expect(result.current.balance).toBeNull();
    expect(result.current.transactions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should expose transactions', () => {
    const { result } = renderHook(() => useWalletStore());

    expect(result.current.transactions).toEqual([]);
  });
});
