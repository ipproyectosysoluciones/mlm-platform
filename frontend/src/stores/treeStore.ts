/**
 * TreeStore - Zustand store para el estado del árbol visual
 * TreeStore - Zustand store for visual tree state
 *
 * Phase 3: Gestiona estado de React Flow incluyendo nodos seleccionados,
 * búsqueda, panel de detalles y navegación.
 * Phase 3: Manages React Flow state including selected nodes,
 * search, details panel, and navigation.
 *
 * @module stores/treeStore
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { TreeNode, UserDetails, User } from '../types';
import { userService } from '../services/api';

interface TreeState {
  // Data
  tree: TreeNode | null;
  selectedNodeId: string | null;
  selectedNodeDetails: UserDetails | null;

  // UI State
  isDetailsPanelOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Search
  searchQuery: string;
  searchResults: User[];
  isSearching: boolean;

  // Navigation
  depth: number;
  zoomLevel: number;

  // Actions
  setTree: (tree: TreeNode | null) => void;
  selectNode: (nodeId: string | null) => void;
  setNodeDetails: (details: UserDetails | null) => void;
  toggleDetailsPanel: (open?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: User[]) => void;
  setIsSearching: (searching: boolean) => void;
  setDepth: (depth: number) => void;
  setZoomLevel: (zoom: number) => void;
  clearSearch: () => void;
  reset: () => void;
}

const initialState = {
  tree: null,
  selectedNodeId: null,
  selectedNodeDetails: null,
  isDetailsPanelOpen: false,
  isLoading: false,
  error: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  depth: 3,
  zoomLevel: 1,
};

export const useTreeStore = create<TreeState>((set) => ({
  ...initialState,

  setTree: (tree) => set({ tree }),

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, isDetailsPanelOpen: !!nodeId });

    if (nodeId) {
      // Fetch details asynchronously
      userService
        .getUserDetails(nodeId)
        .then((details) => set({ selectedNodeDetails: details }))
        .catch((err) => {
          console.error('Failed to fetch user details:', err);
          set({ selectedNodeDetails: null });
        });
    } else {
      set({ selectedNodeDetails: null });
    }
  },

  setNodeDetails: (details) => set({ selectedNodeDetails: details }),

  toggleDetailsPanel: (open) =>
    set((state) => ({
      isDetailsPanelOpen: open !== undefined ? open : !state.isDetailsPanelOpen,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchResults: (results) => set({ searchResults: results }),

  setIsSearching: (searching) => set({ isSearching: searching }),

  setDepth: (depth) => set({ depth: Math.min(10, Math.max(1, depth)) }),

  setZoomLevel: (zoom) => set({ zoomLevel: Math.min(2, Math.max(0.25, zoom)) }),

  clearSearch: () => set({ searchQuery: '', searchResults: [], isSearching: false }),

  reset: () => set(initialState),
}));

// Selector hooks para componentes específicos
export const useSelectedNode = () =>
  useTreeStore(
    useShallow((state) => ({
      nodeId: state.selectedNodeId,
      details: state.selectedNodeDetails,
      isOpen: state.isDetailsPanelOpen,
    }))
  );

export const useTreeSearch = () =>
  useTreeStore(
    useShallow((state) => ({
      query: state.searchQuery,
      results: state.searchResults,
      isSearching: state.isSearching,
    }))
  );
