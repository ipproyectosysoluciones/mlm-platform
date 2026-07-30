/**
 * @fileoverview Shared types for AdminCrudTable and related components
 * @module components/admin/AdminCrudTableTypes
 */

import type { ReactNode } from 'react';

// ============================================
// Column & Filter definitions
// ============================================

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  render: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export type FilterType = 'select' | 'text';

export interface SelectFilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  type: FilterType;
  value: string;
  onChange: (value: string) => void;
  options?: SelectFilterOption[];
  placeholder?: string;
  className?: string;
}

// ============================================
// Pagination & API
// ============================================

export interface ListParams {
  page: number;
  limit: number;
  [key: string]: unknown;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  [key: string]: unknown;
}

/**
 * Generic CRUD API interface for admin entities.
 * Each entity (property, tour, reservation) provides its own implementation
 * wrapping the corresponding adminService methods.
 *
 * @ready tenantId — when migrating to multi-tenant, add tenantId to list params
 */
export interface CrudApi<T extends { id: string }> {
  list(params: ListParams): Promise<ListResponse<T>>;
  create?(data: Partial<T>): Promise<T>;
  update?(id: string, data: Partial<T>): Promise<T>;
  delete?(id: string): Promise<void>;
  toggleStatus?(id: string): Promise<T>;
  updateStatus?(id: string, status: string, notes?: string): Promise<T>;
}

// ============================================
// Form modal
// ============================================

export interface FormProps<T> {
  /** null = creating, object = editing */
  initialData: Partial<T> | null;
  /** Called with form field values when save is triggered */
  onSave: (data: Record<string, unknown>) => Promise<void>;
  /** Whether a save operation is in flight */
  saving: boolean;
  /** Validation errors keyed by field name */
  errors?: Record<string, string>;
}

/**
 * Configuration for AdminStatusBadge.
 * Maps a status value to its display label and color.
 *
 * @ready tenantId — status configs may differ per tenant
 */
export interface StatusConfig {
  value: string;
  label: string;
  color: string;
}

// ============================================
// Notes modal (Reservations)
// ============================================

export interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentStatus: string;
  statusOptions: { value: string; label: string }[];
  currentNotes: string;
  onSave: (status: string, notes: string) => Promise<void>;
}
