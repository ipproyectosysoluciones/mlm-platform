/**
 * @fileoverview Tours Store - Zustand store for tour package listings
 * @description Manages featured and paginated tour listings for the landing page and catalog.
 *               Gestiona listados de tours destacados y paginados para la landing y el catálogo.
 * @module stores/toursStore
 * @author Nexo Real Development Team
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { tourService } from '../services/tourService';
import type { TourPackage, TourListParams } from '../services/tourService';

// ============================================
// Types / Tipos
// ============================================

/**
 * Tours store state interface
 * Interfaz del estado del store de tours
 */
interface ToursState {
  /** Featured tour packages for the landing page / Paquetes de tour destacados para la landing */
  featuredTours: TourPackage[];
  /** Whether featured tours are loading / Si se están cargando tours destacados */
  isFetchingFeatured: boolean;
  /** Error message for featured fetch / Mensaje de error al obtener destacados */
  featuredError: string | null;

  /** Fetch featured tours (first 6 active packages)
   *  Obtener tours destacados (primeros 6 paquetes activos)
   */
  fetchFeatured: () => Promise<void>;

  /** Reset store to initial state / Resetear el store al estado inicial */
  reset: () => void;
}

// ============================================
// Initial State / Estado inicial
// ============================================

const initialState = {
  featuredTours: [],
  isFetchingFeatured: false,
  featuredError: null,
};

// ============================================
// Store / Store
// ============================================

export const useToursStore = create<ToursState>((set) => ({
  ...initialState,

  /**
   * Fetch the first 6 active tour packages to show as featured on the landing page.
   * Obtener los primeros 6 paquetes de tour activos para mostrar como destacados en la landing.
   */
  fetchFeatured: async () => {
    set({ isFetchingFeatured: true, featuredError: null });
    try {
      const params: TourListParams = { page: 1, limit: 6 };
      const response = await tourService.getTours(params);
      set({
        featuredTours: response.data,
        isFetchingFeatured: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar tours destacados';
      set({ featuredError: message, isFetchingFeatured: false });
    }
  },

  /**
   * Reset store to initial state
   * Resetear el store al estado inicial
   */
  reset: () => set(initialState),
}));

// ============================================
// Selector Hooks / Hooks selectores
// ============================================

/**
 * Hook for featured tours on the landing page.
 * Hook para tours destacados en la landing page.
 */
export const useFeaturedTours = () =>
  useToursStore(
    useShallow((state) => ({
      featuredTours: state.featuredTours,
      isFetchingFeatured: state.isFetchingFeatured,
      featuredError: state.featuredError,
      fetchFeatured: state.fetchFeatured,
    }))
  );

export default useToursStore;
