/**
 * @fileoverview InventoryMovement - Audit trail for stock changes
 * @description Sequelize model for tracking all inventory movements:
 *             initial, reserve, release, adjust, return.
 *             Modelo Sequelize para rastrear todos los movimientos de inventario.
 * @module models/InventoryMovement
 * @author MLM Development Team
 *
 * @example
 * // English: Get all movements for a product
 * const movements = await InventoryMovement.findAll({
 *   where: { productId: 'uuid' },
 *   order: [['createdAt', 'DESC']],
 * });
 *
 * // Español: Obtener todos los movimientos de un producto
 * const movements = await InventoryMovement.findAll({
 *   where: { productId: 'uuid' },
 *   order: [['createdAt', 'DESC']],
 * });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type { InventoryMovementAttributes, InventoryMovementType } from '../types';

type InventoryMovementCreation = Optional<
  InventoryMovementAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * InventoryMovement Model - Audit trail for stock changes
 * Modelo de Movimiento de Inventario - Trazabilidad de cambios de stock
 */
export class InventoryMovement
  extends Model<InventoryMovementAttributes, InventoryMovementCreation>
  implements InventoryMovementAttributes
{
  declare id: string;
  declare productId: string;
  declare type: InventoryMovementType;
  declare quantity: number;
  declare reason: string;
  declare referenceId: string | null;
  declare performedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare product?: Product | null;
  declare performedByUser?: User | null;
}

// Placeholder imports for associations - will be set up in index.ts
import type { Product } from './Product';
import type { User } from './User';

InventoryMovement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
      comment: 'Product this movement affects / Producto que este movimiento afecta',
    },
    type: {
      type: DataTypes.ENUM('initial', 'reserve', 'release', 'adjust', 'return'),
      allowNull: false,
      comment: 'Movement type: initial, reserve, release, adjust, return',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Quantity changed (positive or negative) / Cantidad cambiada (positiva o negativa)',
      validate: {
        notZero(value: number): void {
          if (value === 0) {
            throw new Error('Movement quantity cannot be zero');
          }
        },
      },
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Reason for the movement / Razón del movimiento',
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reference_id',
      comment:
        'Reference to related entity (order, return, etc.) / Referencia a entidad relacionada',
    },
    performedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'performed_by',
      comment: 'User who performed this action / Usuario que realizó esta acción',
    },
  },
  {
    sequelize,
    tableName: 'inventory_movements',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['type'] },
      { fields: ['performed_by'] },
      { fields: ['reference_id'] },
      { fields: ['created_at'] },
      { fields: ['product_id', 'type', 'created_at'] },
    ],
  }
);
