/**
 * @fileoverview ShippingAddressService - Shipping address management
 * @description Service for managing user shipping addresses with default address logic.
 *             Servicio para gestionar direcciones de envío de usuarios.
 * @module services/ShippingAddressService
 * @author MLM Development Team
 *
 * @example
 * // English: Create a new shipping address
 * const address = await shippingAddressService.create(userId, addressData);
 *
 * // Español: Crear nueva dirección de envío
 * const address = await shippingAddressService.create(uuid-usuario, datosDireccion);
 */
import { sequelize } from '../config/database';
import { ShippingAddress } from '../models/ShippingAddress';
import { AppError } from '../middleware/error.middleware';
import type { ShippingAddressCreationAttributes } from '../types';

const MAX_ADDRESSES_PER_USER = 10;

export type CreateAddressData = Omit<ShippingAddressCreationAttributes, 'userId'>;
export type UpdateAddressData = Partial<Omit<ShippingAddressCreationAttributes, 'userId'>>;

/**
 * ShippingAddressService - Handles shipping address CRUD operations
 * ShippingAddressService - Maneja operaciones CRUD de direcciones de envío
 */
export class ShippingAddressService {
  /**
   * Create a new shipping address for a user
   * Crear nueva dirección de envío para un usuario
   *
   * @param {string} userId - User UUID
   * @param {CreateAddressData} data - Address creation data
   * @returns {Promise<ShippingAddress>} Created address
   * @throws {AppError} 400 if user already has max addresses (10)
   */
  async create(userId: string, data: CreateAddressData): Promise<ShippingAddress> {
    // Check address limit
    const count = await ShippingAddress.count({ where: { userId } });
    if (count >= MAX_ADDRESSES_PER_USER) {
      throw new AppError(
        400,
        'ADDRESS_LIMIT_EXCEEDED',
        `Maximum of ${MAX_ADDRESSES_PER_USER} addresses per user reached`
      );
    }

    const transaction = await sequelize.transaction();

    try {
      // If this is the first address or isDefault is true, set as default
      let shouldBeDefault = data.isDefault ?? false;
      if (count === 0) {
        shouldBeDefault = true;
      }

      // If setting as default, unset previous default
      if (shouldBeDefault) {
        await ShippingAddress.update(
          { isDefault: false },
          { where: { userId, isDefault: true }, transaction }
        );
      }

      const address = await ShippingAddress.create(
        {
          userId,
          label: data.label ?? null,
          recipientName: data.recipientName,
          street: data.street,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          phone: data.phone ?? null,
          isDefault: shouldBeDefault,
          instructions: data.instructions ?? null,
        },
        { transaction }
      );

      await transaction.commit();
      return address;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all shipping addresses for a user (default first)
   * Obtener todas las direcciones de envío de un usuario (predeterminada primero)
   *
   * @param {string} userId - User UUID
   * @returns {Promise<ShippingAddress[]>} Array of addresses
   */
  async findAllByUser(userId: string): Promise<ShippingAddress[]> {
    const addresses = await ShippingAddress.findAll({
      where: { userId },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    return addresses;
  }

  /**
   * Get a specific shipping address by ID
   * Obtener dirección de envío específica por ID
   *
   * @param {string} id - Address UUID
   * @param {string} userId - User UUID (for ownership check)
   * @returns {Promise<ShippingAddress>} Address instance
   * @throws {AppError} 404 if address not found or not owned by user
   */
  async findById(id: string, userId: string): Promise<ShippingAddress> {
    const address = await ShippingAddress.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Shipping address not found');
    }

    return address;
  }

  /**
   * Update a shipping address
   * Actualizar dirección de envío
   *
   * @param {string} id - Address UUID
   * @param {string} userId - User UUID (for ownership check)
   * @param {UpdateAddressData} data - Address update data
   * @returns {Promise<ShippingAddress>} Updated address
   */
  async update(id: string, userId: string, data: UpdateAddressData): Promise<ShippingAddress> {
    const address = await this.findById(id, userId);

    const transaction = await sequelize.transaction();

    try {
      // If setting as default, unset previous default
      if (data.isDefault === true && !address.isDefault) {
        await ShippingAddress.update(
          { isDefault: false },
          { where: { userId, isDefault: true }, transaction }
        );
      }

      await address.update(data, { transaction });
      await transaction.commit();
      return address.reload();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete a shipping address (soft delete)
   * Eliminar dirección de envío (soft delete)
   *
   * @param {string} id - Address UUID
   * @param {string} userId - User UUID (for ownership check)
   * @returns {Promise<void>}
   * @throws {AppError} 400 if trying to delete default address
   */
  async delete(id: string, userId: string): Promise<void> {
    const address = await this.findById(id, userId);

    if (address.isDefault) {
      throw new AppError(400, 'CANNOT_DELETE_DEFAULT', 'Cannot delete default shipping address');
    }

    await address.destroy();
  }

  /**
   * Set an address as default (unset previous default atomically)
   * Establecer dirección como predeterminada (desactivar anterior atómicamente)
   *
   * @param {string} id - Address UUID
   * @param {string} userId - User UUID (for ownership check)
   * @returns {Promise<ShippingAddress>} Updated address
   */
  async setDefault(id: string, userId: string): Promise<ShippingAddress> {
    const address = await this.findById(id, userId);

    if (address.isDefault) {
      return address; // Already default
    }

    const transaction = await sequelize.transaction();

    try {
      // Unset previous default
      await ShippingAddress.update(
        { isDefault: false },
        { where: { userId, isDefault: true }, transaction }
      );

      // Set new default
      await address.update({ isDefault: true }, { transaction });

      await transaction.commit();
      return address.reload();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get default shipping address for a user
   * Obtener dirección de envío predeterminada de un usuario
   *
   * @param {string} userId - User UUID
   * @returns {Promise<ShippingAddress | null>} Default address or null
   */
  async getDefault(userId: string): Promise<ShippingAddress | null> {
    const address = await ShippingAddress.findOne({
      where: { userId, isDefault: true },
    });
    return address;
  }
}
