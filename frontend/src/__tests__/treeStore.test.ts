/**
 * @fileoverview Tree Store Unit Tests
 * @description Tests for Zustand tree store state management
 * @module stores/treeStore.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTreeStore, useSelectedNode, useTreeSearch } from '../stores/treeStore';
import type { TreeNode, UserDetails } from '../types';

// Mock the API service
vi.mock('../services/api', () => ({
  userService: {
    getUserDetails: vi.fn(),
  },
  treeService: {
    getMyTree: vi.fn(),
    getTree: vi.fn(),
  },
}));

import { userService } from '../services/api';

const mockUserService = userService as ReturnType<typeof vi.fn>;

// Test data
const mockTreeNode: TreeNode = {
  id: 'user-1',
  email: 'test@example.com',
  referralCode: 'ABC123',
  position: 'left',
  level: 1,
  stats: { leftCount: 2, rightCount: 3 },
  children: [
    {
      id: 'user-2',
      email: 'child1@example.com',
      referralCode: 'CHILD1',
      position: 'left',
      level: 2,
      stats: { leftCount: 1, rightCount: 0 },
      children: [],
    },
    {
      id: 'user-3',
      email: 'child2@example.com',
      referralCode: 'CHILD2',
      position: 'right',
      level: 2,
      stats: { leftCount: 0, rightCount: 1 },
      children: [],
    },
  ],
};

const mockUserDetails: UserDetails = {
  id: 'user-1',
  email: 'test@example.com',
  referralCode: 'ABC123',
  position: 'left',
  level: 1,
  status: 'active',
  createdAt: '2024-01-01',
  stats: {
    leftCount: 2,
    rightCount: 3,
    totalDownline: 5,
  },
};

describe('useTreeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useTreeStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('setTree', () => {
    it('should set the tree data', () => {
      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.setTree(mockTreeNode);
      });

      expect(result.current.tree).toEqual(mockTreeNode);
    });

    it('should set tree to null on reset', () => {
      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.setTree(mockTreeNode);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.tree).toBeNull();
    });
  });

  describe('selectNode', () => {
    it('should set selected node ID and open details panel', async () => {
      mockUserService.getUserDetails.mockResolvedValue(mockUserDetails);

      const { result } = renderHook(() => useTreeStore());

      await act(async () => {
        await result.current.selectNode('user-1');
      });

      expect(result.current.selectedNodeId).toBe('user-1');
      expect(result.current.isDetailsPanelOpen).toBe(true);
    });

    it('should clear selected node when null', async () => {
      const { result } = renderHook(() => useTreeStore());

      // First select a node
      await act(async () => {
        await result.current.selectNode('user-1');
      });

      // Then deselect
      await act(async () => {
        await result.current.selectNode(null);
      });

      expect(result.current.selectedNodeId).toBeNull();
      expect(result.current.isDetailsPanelOpen).toBe(false);
    });
  });

  describe('setNodeDetails', () => {
    it('should set node details manually', () => {
      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.setNodeDetails(mockUserDetails);
      });

      expect(result.current.selectedNodeDetails).toEqual(mockUserDetails);
    });
  });

  describe('toggleDetailsPanel', () => {
    it('should toggle panel open state', () => {
      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.toggleDetailsPanel();
      });

      expect(result.current.isDetailsPanelOpen).toBe(true);

      act(() => {
        result.current.toggleDetailsPanel();
      });

      expect(result.current.isDetailsPanelOpen).toBe(false);
    });

    it('should set specific open state when provided', () => {
      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.toggleDetailsPanel(true);
      });

      expect(result.current.isDetailsPanelOpen).toBe(true);

      act(() => {
        result.current.toggleDetailsPanel(false);
      });

      expect(result.current.isDetailsPanelOpen).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error state', () => {
      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.error).toBe('Something went wrong');
    });
  });

  describe('search functionality', () => {
    it('should set search query', () => {
      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.setSearchQuery('test query');
      });

      expect(result.current.searchQuery).toBe('test query');
    });

    it('should set search results', () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', referralCode: 'REF1', level: 1 },
        { id: '2', email: 'user2@test.com', referralCode: 'REF2', level: 2 },
      ];

      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.setSearchResults(mockUsers as any);
      });

      expect(result.current.searchResults).toEqual(mockUsers);
    });

    it('should clear search', () => {
      const { result } = renderHook(() => useTreeStore());

      // Set some search state
      act(() => {
        result.current.setSearchQuery('test');
        result.current.setSearchResults([
          { id: '1', email: 'test@test.com', referralCode: 'REF1', level: 1 },
        ] as any);
        result.current.setIsSearching(true);
      });

      // Clear search
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });
  });

  describe('navigation', () => {
    it('should set depth with bounds (1-10)', () => {
      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.setDepth(5);
      });

      expect(result.current.depth).toBe(5);

      // Test boundary values
      act(() => {
        result.current.setDepth(0);
      });

      expect(result.current.depth).toBe(1); // Clamped to min

      act(() => {
        result.current.setDepth(15);
      });

      expect(result.current.depth).toBe(10); // Clamped to max
    });

    it('should set zoom level with bounds (0.25-2)', () => {
      const { result } = renderHook(() => useTreeStore());

      act(() => {
        result.current.setZoomLevel(1);
      });

      expect(result.current.zoomLevel).toBe(1);

      // Test boundary values
      act(() => {
        result.current.setZoomLevel(0.1);
      });

      expect(result.current.zoomLevel).toBe(0.25); // Clamped to min

      act(() => {
        result.current.setZoomLevel(3);
      });

      expect(result.current.zoomLevel).toBe(2); // Clamped to max
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useTreeStore());

      // Modify state
      act(() => {
        result.current.setTree(mockTreeNode);
        result.current.setSearchQuery('test');
        result.current.setError('Some error');
        result.current.setDepth(5);
        result.current.setZoomLevel(1.5);
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.tree).toBeNull();
      expect(result.current.selectedNodeId).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.searchQuery).toBe('');
      expect(result.current.depth).toBe(3); // Default
      expect(result.current.zoomLevel).toBe(1); // Default
    });
  });
});

describe('useSelectedNode hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose selected node state', () => {
    const selectedNode = renderHook(() => useSelectedNode());

    expect(selectedNode.result.current).toHaveProperty('nodeId');
    expect(selectedNode.result.current).toHaveProperty('details');
    expect(selectedNode.result.current).toHaveProperty('isOpen');
  });
});

describe('useTreeSearch hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose tree search state', () => {
    const searchState = renderHook(() => useTreeSearch());

    expect(searchState.result.current).toHaveProperty('query');
    expect(searchState.result.current).toHaveProperty('results');
    expect(searchState.result.current).toHaveProperty('isSearching');
  });
});
