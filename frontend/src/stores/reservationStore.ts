/**
 * @fileoverview Reservation Store - Zustand store for reservation wizard state
 * @description Manages the 3-step reservation wizard state: dates → guest data → confirmation
 *               Gestiona el estado del wizard de reserva de 3 pasos: fechas → datos → confirmación
 * @module stores/reservationStore
 * @author Nexo Real Development Team
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { reservationService } from '../services/reservationService';
import type {
  Reservation,
  CreateReservationPayload,
  ReservationListResponse,
  ReservationListParams,
} from '../services/reservationService';
import type { Property } from '../services/propertyService';
import type { TourPackage, TourAvailability } from '../services/tourService';

// ============================================
// Types / Tipos
// ============================================

/**
 * Wizard step enum
 * Enum de paso del wizard
 */
export type WizardStep = 'dates' | 'guests' | 'confirm';

/**
 * Wizard data for a property reservation
 * Datos del wizard para reserva de propiedad
 */
export interface PropertyWizardData {
  type: 'property';
  property: Property;
  checkIn: string;
  checkOut: string;
  guests: number;
  notes: string;
}

/**
 * Wizard data for a tour reservation
 * Datos del wizard para reserva de tour
 */
export interface TourWizardData {
  type: 'tour';
  tour: TourPackage;
  availability: TourAvailability;
  guests: number;
  notes: string;
}

export type WizardData = PropertyWizardData | TourWizardData;

/**
 * Reservation store state interface
 * Interfaz del estado del store de reservaciones
 */
interface ReservationState {
  // Wizard State / Estado del wizard
  wizardStep: WizardStep;
  wizardData: WizardData | null;
  isWizardOpen: boolean;

  // My Reservations / Mis reservas
  myReservations: Reservation[];
  reservationsPagination: ReservationListResponse['pagination'] | null;
  isFetchingReservations: boolean;
  reservationsError: string | null;

  // Reservation creation / Creación de reserva
  isCreating: boolean;
  createdReservation: Reservation | null;
  createError: string | null;

  // Reservation cancellation / Cancelación de reserva
  isCancelling: boolean;
  cancelError: string | null;

  // Wizard Actions / Acciones del wizard
  startPropertyReservation: (property: Property) => void;
  startTourReservation: (tour: TourPackage, availability: TourAvailability) => void;
  setWizardStep: (step: WizardStep) => void;
  updateWizardData: (data: Partial<PropertyWizardData> | Partial<TourWizardData>) => void;
  closeWizard: () => void;

  // CRUD Actions / Acciones CRUD
  fetchMyReservations: (params?: ReservationListParams) => Promise<void>;
  confirmReservation: () => Promise<Reservation>;
  cancelReservation: (id: string) => Promise<void>;

  // Reset
  reset: () => void;
}

// ============================================
// Initial State / Estado inicial
// ============================================

const initialState = {
  wizardStep: 'dates' as WizardStep,
  wizardData: null,
  isWizardOpen: false,

  myReservations: [],
  reservationsPagination: null,
  isFetchingReservations: false,
  reservationsError: null,

  isCreating: false,
  createdReservation: null,
  createError: null,

  isCancelling: false,
  cancelError: null,
};

// ============================================
// Store / Store
// ============================================

export const useReservationStore = create<ReservationState>((set, get) => ({
  ...initialState,

  // ==========================================
  // Wizard Actions / Acciones del wizard
  // ==========================================

  /**
   * Start a property reservation wizard
   * Iniciar el wizard de reserva de propiedad
   */
  startPropertyReservation: (property: Property) => {
    set({
      wizardData: {
        type: 'property',
        property,
        checkIn: '',
        checkOut: '',
        guests: 1,
        notes: '',
      },
      wizardStep: 'dates',
      isWizardOpen: true,
      createdReservation: null,
      createError: null,
    });
  },

  /**
   * Start a tour reservation wizard
   * Iniciar el wizard de reserva de tour
   */
  startTourReservation: (tour: TourPackage, availability: TourAvailability) => {
    set({
      wizardData: {
        type: 'tour',
        tour,
        availability,
        guests: 1,
        notes: '',
      },
      wizardStep: 'guests',
      isWizardOpen: true,
      createdReservation: null,
      createError: null,
    });
  },

  /**
   * Set the current wizard step
   * Establecer el paso actual del wizard
   */
  setWizardStep: (step: WizardStep) => set({ wizardStep: step }),

  /**
   * Update wizard form data (partial)
   * Actualizar datos del formulario del wizard (parcial)
   */
  updateWizardData: (data) => {
    const current = get().wizardData;
    if (!current) return;
    set({ wizardData: { ...current, ...data } as WizardData });
  },

  /**
   * Close wizard and reset wizard state
   * Cerrar wizard y resetear estado del wizard
   */
  closeWizard: () => {
    set({
      isWizardOpen: false,
      wizardStep: 'dates',
      wizardData: null,
      createError: null,
    });
  },

  // ==========================================
  // CRUD Actions / Acciones CRUD
  // ==========================================

  /**
   * Fetch the current user's reservations
   * Obtener las reservas del usuario actual
   */
  fetchMyReservations: async (params?: ReservationListParams) => {
    set({ isFetchingReservations: true, reservationsError: null });
    try {
      const response = await reservationService.getMyReservations(params);
      set({
        myReservations: response.data,
        reservationsPagination: response.pagination,
        isFetchingReservations: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar las reservas';
      set({ reservationsError: message, isFetchingReservations: false });
    }
  },

  /**
   * Confirm and create the reservation from the current wizard data
   * Confirmar y crear la reserva desde los datos actuales del wizard
   */
  confirmReservation: async () => {
    const { wizardData } = get();
    if (!wizardData) throw new Error('No hay datos de reserva en el wizard');

    set({ isCreating: true, createError: null });

    try {
      let payload: CreateReservationPayload;

      if (wizardData.type === 'property') {
        payload = {
          propertyId: wizardData.property.id,
          checkIn: wizardData.checkIn,
          checkOut: wizardData.checkOut,
          guests: wizardData.guests,
          notes: wizardData.notes || undefined,
        };
      } else {
        payload = {
          tourPackageId: wizardData.tour.id,
          tourAvailabilityId: wizardData.availability.id,
          guests: wizardData.guests,
          notes: wizardData.notes || undefined,
        };
      }

      const reservation = await reservationService.createReservation(payload);
      set({
        createdReservation: reservation,
        isCreating: false,
        wizardStep: 'confirm',
      });
      return reservation;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la reserva';
      set({ createError: message, isCreating: false });
      throw error;
    }
  },

  /**
   * Cancel an existing reservation
   * Cancelar una reserva existente
   */
  cancelReservation: async (id: string) => {
    set({ isCancelling: true, cancelError: null });
    try {
      const updated = await reservationService.cancelReservation(id);
      set((state) => ({
        myReservations: state.myReservations.map((r) => (r.id === id ? updated : r)),
        isCancelling: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cancelar la reserva';
      set({ cancelError: message, isCancelling: false });
      throw error;
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
 * Hook for wizard state and actions
 * Hook para estado y acciones del wizard
 */
export const useReservationWizard = () =>
  useReservationStore(
    useShallow((state) => ({
      wizardStep: state.wizardStep,
      wizardData: state.wizardData,
      isWizardOpen: state.isWizardOpen,
      isCreating: state.isCreating,
      createdReservation: state.createdReservation,
      createError: state.createError,
      startPropertyReservation: state.startPropertyReservation,
      startTourReservation: state.startTourReservation,
      setWizardStep: state.setWizardStep,
      updateWizardData: state.updateWizardData,
      closeWizard: state.closeWizard,
      confirmReservation: state.confirmReservation,
    }))
  );

/**
 * Hook for my reservations list
 * Hook para listado de mis reservas
 */
export const useMyReservations = () =>
  useReservationStore(
    useShallow((state) => ({
      myReservations: state.myReservations,
      reservationsPagination: state.reservationsPagination,
      isFetchingReservations: state.isFetchingReservations,
      reservationsError: state.reservationsError,
      isCancelling: state.isCancelling,
      cancelError: state.cancelError,
      fetchMyReservations: state.fetchMyReservations,
      cancelReservation: state.cancelReservation,
    }))
  );

export default useReservationStore;
