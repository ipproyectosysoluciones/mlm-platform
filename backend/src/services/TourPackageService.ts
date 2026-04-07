/**
 * @fileoverview TourPackageService - Business logic for tourism packages
 * @description Service layer for CRUD operations on tourism packages.
 *              Handles filtering, pagination, and soft-delete (paranoid).
 *              Capa de servicio para operaciones CRUD en paquetes turísticos.
 *              Maneja filtrado, paginación y borrado suave (paranoid).
 * @module services/TourPackageService
 * @author MLM Development Team
 *
 * @example
 * // English: List active adventure tours in Colombia
 * const result = await tourPackageService.findAll({ type: 'adventure', country: 'Colombia', status: 'active' });
 *
 * // Español: Listar tours de aventura activos en Colombia
 * const result = await tourPackageService.findAll({ type: 'adventure', country: 'Colombia', status: 'active' });
 */
import { Op, WhereOptions } from 'sequelize';
import { TourPackage, TourAvailability } from '../models';
import type { TourPackageAttributes, TourPackageCreationAttributes } from '../models/TourPackage';

// ============================================
// TYPES
// ============================================

/**
 * Input filters for listing tour packages
 * Filtros de entrada para listar paquetes turísticos
 */
export interface TourPackageFilters {
  /** Tour type / Tipo de tour */
  type?: 'adventure' | 'cultural' | 'relaxation' | 'gastronomic' | 'ecotourism' | 'luxury';
  /** Destination filter / Filtro de destino */
  destination?: string;
  /** Country filter / Filtro de país */
  country?: string;
  /** Listing status / Estado del listado */
  status?: 'active' | 'inactive' | 'draft';
  /** Minimum price / Precio mínimo */
  minPrice?: number;
  /** Maximum price / Precio máximo */
  maxPrice?: number;
  /** Duration in days / Duración en días */
  durationDays?: number;
  /** Page number (1-based) / Número de página (base 1) */
  page?: number;
  /** Page size / Tamaño de página */
  limit?: number;
}

/**
 * Input data for creating or updating a tour package
 * Datos de entrada para crear o actualizar un paquete turístico
 */
export type TourPackageCreateInput = TourPackageCreationAttributes;

// ============================================
// SERVICE CLASS
// ============================================

/**
 * TourPackageService - Handles all tourism package business logic
 * TourPackageService - Gestiona toda la lógica de negocio de paquetes turísticos
 */
export class TourPackageService {
  /**
   * List tour packages with optional filters and pagination
   * Listar paquetes turísticos con filtros opcionales y paginación
   *
   * @param filters - Optional filters and pagination params / Filtros opcionales y parámetros de paginación
   * @returns Paginated list of tour packages / Lista paginada de paquetes turísticos
   */
  async findAll(filters: TourPackageFilters = {}): Promise<{ rows: TourPackage[]; count: number }> {
    const {
      type,
      destination,
      country,
      status,
      minPrice,
      maxPrice,
      durationDays,
      page = 1,
      limit: rawLimit = 20,
    } = filters;

    // Enforce maximum limit / Aplicar límite máximo
    const limit = Math.min(rawLimit, 100);
    const offset = (page - 1) * limit;

    // Build where clause / Construir cláusula where
    const where: WhereOptions<TourPackageAttributes> = {};

    if (type) {
      where.type = type;
    }

    if (destination) {
      where.destination = destination;
    }

    if (country) {
      where.country = country;
    }

    if (status) {
      where.status = status;
    }

    if (durationDays !== undefined) {
      where.durationDays = durationDays;
    }

    // Price range filter / Filtro de rango de precio
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        (where.price as Record<symbol, number>)[Op.gte] = minPrice;
      }
      if (maxPrice !== undefined) {
        (where.price as Record<symbol, number>)[Op.lte] = maxPrice;
      }
    }

    const today = new Date().toISOString().split('T')[0];

    const result = await TourPackage.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: TourAvailability,
          as: 'availabilities',
          required: false,
          where: {
            date: { [Op.gte]: today },
            isBlocked: false,
          },
        },
      ],
    });

    return result;
  }

  /**
   * Find a single tour package by primary key
   * Buscar un paquete turístico por clave primaria
   *
   * @param id - TourPackage UUID / UUID del paquete turístico
   * @returns TourPackage instance / Instancia de paquete turístico
   * @throws { statusCode: 404, code: 'TOUR_PACKAGE_NOT_FOUND', message: string } when not found
   */
  async findById(id: string): Promise<TourPackage> {
    const today = new Date().toISOString().split('T')[0];

    const tourPackage = await TourPackage.findByPk(id, {
      include: [
        {
          model: TourAvailability,
          as: 'availabilities',
          required: false,
          where: {
            date: { [Op.gte]: today },
            isBlocked: false,
          },
        },
      ],
    });

    if (!tourPackage) {
      throw {
        statusCode: 404,
        code: 'TOUR_PACKAGE_NOT_FOUND',
        message: 'Tour package not found',
      };
    }

    return tourPackage;
  }

  /**
   * Create a new tour package
   * Crear un nuevo paquete turístico
   *
   * @param data - Tour package creation data / Datos de creación del paquete turístico
   * @returns Created tour package / Paquete turístico creado
   */
  async create(data: TourPackageCreateInput): Promise<TourPackage> {
    const tourPackage = await TourPackage.create(data as TourPackageAttributes);
    return tourPackage;
  }

  /**
   * Update an existing tour package by ID
   * Actualizar un paquete turístico existente por ID
   *
   * @param id - TourPackage UUID / UUID del paquete turístico
   * @param data - Partial update data / Datos parciales de actualización
   * @returns Updated tour package / Paquete turístico actualizado
   * @throws { statusCode: 404, code: 'TOUR_PACKAGE_NOT_FOUND', message: string } when not found
   */
  async update(id: string, data: Partial<TourPackageCreateInput>): Promise<TourPackage> {
    const tourPackage = await this.findById(id);
    await tourPackage.update(data);
    return tourPackage;
  }

  /**
   * Soft-delete a tour package by ID (paranoid)
   * Eliminar suavemente un paquete turístico por ID (paranoid)
   *
   * @param id - TourPackage UUID / UUID del paquete turístico
   * @throws { statusCode: 404, code: 'TOUR_PACKAGE_NOT_FOUND', message: string } when not found
   */
  async remove(id: string): Promise<void> {
    const tourPackage = await this.findById(id);
    await tourPackage.destroy();
  }
}

/**
 * Singleton instance of TourPackageService
 * Instancia singleton de TourPackageService
 */
export const tourPackageService = new TourPackageService();
