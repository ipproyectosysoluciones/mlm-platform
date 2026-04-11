/**
 * @fileoverview Reservation Store - Zustand store for reservation wizard state
 * @description Manages the 4-step reservation wizard state: dates → guests → confirmation → payment
 *               Gestiona el estado del wizard de reserva de 4 pasos: fechas → huéspedes → confirmación → pago
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
 * Wizard step enum (now includes 'payment' for post-confirmation flow)
 * Enum de paso del wizard (ahora incluye 'payment' para flujo post-confirmación)
 */
export type WizardStep = 'dates' | 'guests' | 'confirm' | 'payment';

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
 * Computed price breakdown for the current wizard state
 * Desglose de precio calculado para el estado actual del wizard
 */
export interface PriceBreakdown {
  /** Price per unit (night for properties, person for tours) / Precio por unidad */
  pricePerUnit: number;
  /** Currency code / Código de moneda */
  currency: string;
  /** Number of nights (property) or 1 (tour) / Cantidad de noches o 1 */
  totalNights: number;
  /** Number of guests / Cantidad de huéspedes */
  guestCount: number;
  /** pricePerUnit × totalNights / Subtotal sin multiplicar por huéspedes */
  subtotal: number;
  /** pricePerUnit × totalNights × guestCount / Total final */
  totalPrice: number;
  /** Whether it's a property (per night) or tour (per person) / Si es propiedad o tour */
  isProperty: boolean;
}

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

  // Payment flow / Flujo de pago
  isProcessingPayment: boolean;
  paymentError: string | null;

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

  // Payment Actions / Acciones de pago
  setPaymentProcessing: (processing: boolean) => void;
  setPaymentError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

// ============================================
// Price Utilities / Utilidades de precio
// ============================================

/**
 * Calculate the number of days between two date strings
 * Calcular la cantidad de días entre dos strings de fecha
 * @param checkIn - ISO date string for check-in
 * @param checkOut - ISO date string for check-out
 * @returns Number of nights (minimum 1)
 */
export function daysBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

/**
 * Compute full price breakdown from current wizard data
 * Calcular desglose completo de precio desde los datos del wizard
 * @param wizardData - Current wizard data / Datos actuales del wizard
 * @returns PriceBreakdown or null if data is insufficient
 */
export function computePriceBreakdown(wizardData: WizardData | null): PriceBreakdown | null {
  if (!wizardData) return null;

  if (wizardData.type === 'property') {
    const totalNights = daysBetween(wizardData.checkIn, wizardData.checkOut);
    const pricePerUnit = wizardData.property.price;
    const currency = wizardData.property.currency;
    const guestCount = wizardData.guests;
    const subtotal = pricePerUnit * totalNights;
    const totalPrice = subtotal * guestCount;

    return {
      pricePerUnit,
      currency,
      totalNights,
      guestCount,
      subtotal,
      totalPrice,
      isProperty: true,
    };
  }

  // Tour: price is per person, 1 "night"
  const pricePerUnit = wizardData.tour.price;
  const currency = wizardData.tour.currency;
  const guestCount = wizardData.guests;
  const totalNights = 1;
  const subtotal = pricePerUnit * totalNights;
  const totalPrice = subtotal * guestCount;

  return {
    pricePerUnit,
    currency,
    totalNights,
    guestCount,
    subtotal,
    totalPrice,
    isProperty: false,
  };
}

/**
 * Format a price amount with currency symbol
 * Formatear un monto con símbolo de moneda
 * @param amount - Numeric amount
 * @param currency - Currency code (e.g. "USD", "ARS")
 * @returns Formatted string like "$1,200.00"
 */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
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

  isProcessingPayment: false,
  paymentError: null,
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
      paymentError: null,
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
      paymentError: null,
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
      paymentError: null,
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

  // ==========================================
  // Payment Actions / Acciones de pago
  // ==========================================

  /**
   * Set payment processing state
   * Establecer estado de procesamiento de pago
   */
  setPaymentProcessing: (processing: boolean) => set({ isProcessingPayment: processing }),

  /**
   * Set payment error
   * Establecer error de pago
   */
  setPaymentError: (error: string | null) => set({ paymentError: error }),

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
      isProcessingPayment: state.isProcessingPayment,
      paymentError: state.paymentError,
      startPropertyReservation: state.startPropertyReservation,
      startTourReservation: state.startTourReservation,
      setWizardStep: state.setWizardStep,
      updateWizardData: state.updateWizardData,
      closeWizard: state.closeWizard,
      confirmReservation: state.confirmReservation,
      setPaymentProcessing: state.setPaymentProcessing,
      setPaymentError: state.setPaymentError,
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
