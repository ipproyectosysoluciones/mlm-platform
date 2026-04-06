/**
 * @fileoverview PropertyService - Business logic for property listings
 * @description Service layer for CRUD operations on properties.
 *              Handles filtering, pagination, and soft-delete (paranoid).
 * @module services/PropertyService
 * @author MLM Development Team
 *
 * @example
 * // English: List available properties in Bogotá
 * const result = await propertyService.findAll({ city: 'Bogotá', status: 'available' });
 *
 * // Español: Listar propiedades disponibles en Bogotá
 * const result = await propertyService.findAll({ city: 'Bogotá', status: 'available' });
 */
import { Op, WhereOptions } from 'sequelize';
import { Property } from '../models';
import type { PropertyAttributes, PropertyCreationAttributes } from '../models/Property';

// ============================================
// TYPES
// ============================================

/**
 * Input filters for listing properties
 * Filtros de entrada para listar propiedades
 */
export interface PropertyFilters {
  /** Listing type / Tipo de listado */
  type?: 'rental' | 'sale' | 'management';
  /** City filter / Filtro de ciudad */
  city?: string;
  /** Minimum price / Precio mínimo */
  minPrice?: number;
  /** Maximum price / Precio máximo */
  maxPrice?: number;
  /** Number of bedrooms / Número de habitaciones */
  bedrooms?: number;
  /** Listing status / Estado del listado */
  status?: 'available' | 'rented' | 'sold' | 'paused';
  /** Page number (1-based) / Número de página (base 1) */
  page?: number;
  /** Page size / Tamaño de página */
  limit?: number;
}

/**
 * Input data for creating or updating a property
 * Datos de entrada para crear o actualizar una propiedad
 */
export type PropertyCreateInput = PropertyCreationAttributes;

// ============================================
// SERVICE CLASS
// ============================================

/**
 * PropertyService - Handles all property listing business logic
 * PropertyService - Gestiona toda la lógica de negocio de listados inmobiliarios
 */
export class PropertyService {
  /**
   * List properties with optional filters and pagination
   * Listar propiedades con filtros opcionales y paginación
   *
   * @param filters - Optional filters and pagination params / Filtros opcionales y parámetros de paginación
   * @returns Paginated list of properties / Lista paginada de propiedades
   */
  async findAll(filters: PropertyFilters = {}): Promise<{ rows: Property[]; count: number }> {
    const {
      type,
      city,
      minPrice,
      maxPrice,
      bedrooms,
      status,
      page = 1,
      limit: rawLimit = 20,
    } = filters;

    // Enforce maximum limit
    const limit = Math.min(rawLimit, 100);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: WhereOptions<PropertyAttributes> = {};

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = city;
    }

    if (bedrooms !== undefined) {
      where.bedrooms = bedrooms;
    }

    if (status) {
      where.status = status;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        (where.price as Record<symbol, number>)[Op.gte] = minPrice;
      }
      if (maxPrice !== undefined) {
        (where.price as Record<symbol, number>)[Op.lte] = maxPrice;
      }
    }

    const result = await Property.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return result;
  }

  /**
   * Find a single property by primary key
   * Buscar una propiedad por clave primaria
   *
   * @param id - Property UUID / UUID de la propiedad
   * @returns Property instance / Instancia de propiedad
   * @throws { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: string } when not found
   */
  async findById(id: string): Promise<Property> {
    const property = await Property.findByPk(id);

    if (!property) {
      throw {
        statusCode: 404,
        code: 'PROPERTY_NOT_FOUND',
        message: 'Property not found',
      };
    }

    return property;
  }

  /**
   * Create a new property listing
   * Crear un nuevo listado de propiedad
   *
   * @param data - Property creation data / Datos de creación de propiedad
   * @returns Created property / Propiedad creada
   */
  async create(data: PropertyCreateInput): Promise<Property> {
    const property = await Property.create(data as PropertyAttributes);
    return property;
  }

  /**
   * Update an existing property by ID
   * Actualizar una propiedad existente por ID
   *
   * @param id - Property UUID / UUID de la propiedad
   * @param data - Partial update data / Datos parciales de actualización
   * @returns Updated property / Propiedad actualizada
   * @throws { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: string } when not found
   */
  async update(id: string, data: Partial<PropertyCreateInput>): Promise<Property> {
    const property = await this.findById(id);
    await property.update(data);
    return property;
  }

  /**
   * Soft-delete a property by ID (paranoid)
   * Eliminar suavemente una propiedad por ID (paranoid)
   *
   * @param id - Property UUID / UUID de la propiedad
   * @throws { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: string } when not found
   */
  async remove(id: string): Promise<void> {
    const property = await this.findById(id);
    await property.destroy();
  }
}

/**
 * Singleton instance of PropertyService
 * Instancia singleton de PropertyService
 */
export const propertyService = new PropertyService();
