/**
 * @fileoverview Generic CRUD API adapter for admin entities.
 * Wraps adminService methods into a standard CrudApi<T> interface,
 * normalizing inconsistent API response shapes.
 *
 * @module services/crud-api
 */

import type { CrudApi, ListParams, ListResponse } from '@/components/admin/AdminCrudTableTypes';

/**
 * Response normalizer — handles inconsistent API response shapes.
 *
 * The backend endpoints return different shapes:
 * - Some return `{ data: [...] }`
 * - Others return `{ properties: [...] }` or `{ tours: [...] }`
 *
 * This normalizer extracts the array using a key fallback chain.
 */
function normalizeListResponse<T>(
  response: unknown,
  dataKey?: string
): { items: T[]; total: number } {
  const resp = response as Record<string, unknown>;

  // If the response itself is an array, use it directly
  if (Array.isArray(response)) {
    return { items: response as T[], total: response.length };
  }

  // Try explicit data key first
  if (dataKey) {
    const byKey = resp[dataKey];
    if (Array.isArray(byKey)) {
      return { items: byKey as T[], total: (resp.total as number) ?? byKey.length };
    }
  }

  // Try common fallback keys
  const data = resp.data;
  if (Array.isArray(data)) {
    return { items: data as T[], total: (resp.total as number) ?? data.length };
  }

  // Try items key
  const items = resp.items;
  if (Array.isArray(items)) {
    return { items: items as T[], total: (resp.total as number) ?? items.length };
  }

  return { items: [], total: 0 };
}

/**
 * Creates a CrudApi<T> adapter from individual async operations.
 *
 * @example
 * ```ts
 * const propertyApi = createCrudApi({
 *   list: (params) => adminService.getAdminProperties(params),
 *   create: (data) => adminService.createProperty(data),
 *   update: (id, data) => adminService.updateProperty(id, data),
 *   delete: (id) => adminService.deleteProperty(id),
 *   toggleStatus: (id) => adminService.updateProperty(id, { status: 'available' }),
 *   dataKey: 'properties',
 * });
 * ```
 *
 * @ready tenantId — when migrating to multi-tenant, pass tenantId through params
 */
export function createCrudApi<T extends { id: string }>(config: {
  list: (params: ListParams) => Promise<unknown>;
  create?: (data: Partial<T>) => Promise<T>;
  update?: (id: string, data: Partial<T>) => Promise<T>;
  delete?: (id: string) => Promise<void>;
  toggleStatus?: (id: string) => Promise<T>;
  updateStatus?: (id: string, status: string, notes?: string) => Promise<T>;
  dataKey?: string;
}): CrudApi<T> {
  return {
    list: async (params: ListParams): Promise<ListResponse<T>> => {
      const response = await config.list(params);
      const { items, total } = normalizeListResponse<T>(response, config.dataKey);
      return { data: items, total };
    },

    ...(config.create && {
      create: async (data: Partial<T>): Promise<T> => {
        return config.create!(data);
      },
    }),

    ...(config.update && {
      update: async (id: string, data: Partial<T>): Promise<T> => {
        return config.update!(id, data);
      },
    }),

    ...(config.delete && {
      delete: async (id: string): Promise<void> => {
        return config.delete!(id);
      },
    }),

    ...(config.toggleStatus && {
      toggleStatus: async (id: string): Promise<T> => {
        return config.toggleStatus!(id);
      },
    }),

    ...(config.updateStatus && {
      updateStatus: async (id: string, status: string, notes?: string): Promise<T> => {
        return config.updateStatus!(id, status, notes);
      },
    }),
  };
}
