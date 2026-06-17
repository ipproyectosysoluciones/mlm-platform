/**
 * @fileoverview Properties Store - Zustand store for property listings
 * @description Manages featured and paginated property listings for the landing page and catalog.
 *               Gestiona listados de propiedades destacadas y paginadas para la landing y el catálogo.
 * @module stores/propertiesStore
 * @author Nexo Real Development Team
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { propertyService } from '../services/propertyService';
import type { Property, PropertyListParams } from '../services/propertyService';

// ============================================
// Types / Tipos
// ============================================

/**
 * Properties store state interface
 * Interfaz del estado del store de propiedades
 */
interface PropertiesState {
  /** Featured properties for the landing page / Propiedades destacadas para la landing */
  featuredProperties: Property[];
  /** Whether featured properties are loading / Si se están cargando propiedades destacadas */
  isFetchingFeatured: boolean;
  /** Error message for featured fetch / Mensaje de error al obtener destacadas */
  featuredError: string | null;

  /** Fetch featured properties (first 6 active properties)
   *  Obtener propiedades destacadas (primeras 6 activas)
   */
  fetchFeatured: () => Promise<void>;

  /** Reset store to initial state / Resetear el store al estado inicial */
  reset: () => void;
}

// ============================================
// Initial State / Estado inicial
// ============================================

const initialState = {
  featuredProperties: [],
  isFetchingFeatured: false,
  featuredError: null,
};

// ============================================
// Store / Store
// ============================================

export const usePropertiesStore = create<PropertiesState>((set) => ({
  ...initialState,

  /**
   * Fetch the first 6 active properties to show as featured on the landing page.
   * Obtener las primeras 6 propiedades activas para mostrar como destacadas en la landing.
   */
  fetchFeatured: async () => {
    set({ isFetchingFeatured: true, featuredError: null });
    try {
      const params: PropertyListParams = { page: 1, limit: 6 };
      const response = await propertyService.getProperties(params);
      set({
        featuredProperties: Array.isArray(response?.data) ? response.data : [],
        isFetchingFeatured: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al cargar propiedades destacadas';
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
 * Hook for featured properties on the landing page.
 * Hook para propiedades destacadas en la landing page.
 */
export const useFeaturedProperties = () =>
  usePropertiesStore(
    useShallow((state) => ({
      featuredProperties: state.featuredProperties,
      isFetchingFeatured: state.isFetchingFeatured,
      featuredError: state.featuredError,
      fetchFeatured: state.fetchFeatured,
    }))
  );

export default usePropertiesStore;
