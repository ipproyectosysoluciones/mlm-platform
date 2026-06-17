/**
 * @fileoverview Invoice - Invoice model for billing and invoicing system
 * @description Sequelize model for invoices with associations to User and Order.
 *             Modelo Sequelize para facturas con asociaciones a Usuario y Pedido.
 * @module models/Invoice
 * @author MLM Development Team
 *
 * @example
 * // English: Get user's invoices with order details
 * const invoices = await Invoice.findAll({
 *   where: { userId: 'user-uuid' },
 *   include: ['order']
 * });
 *
 * // Español: Obtener facturas del usuario con detalles de pedido
 * const invoices = await Invoice.findAll({
 *   where: { userId: 'uuid-usuario' },
 *   include: ['order']
 * });
 */
import { DataTypes, Model, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Order } from './Order';
import type {
  InvoiceAttributes,
  InvoiceCreationAttributes,
  InvoiceType,
  InvoiceStatus,
  InvoiceItem,
} from '../types';

/**
 * Invoice Model - Represents invoices for billing and accounting
 * Modelo de Factura - Representa facturas para facturación y contabilidad
 */
export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> {
  /** Unique identifier / Identificador único */
  declare id: string;
  /** Associated order ID (nullable) / ID de pedido asociado (nullable) */
  declare orderId: ForeignKey<Order['id']> | null;
  /** Owner user ID / ID del usuario propietario */
  declare userId: ForeignKey<User['id']>;
  /** Human-readable invoice number / Número de factura legible */
  declare invoiceNumber: string;
  /** Invoice type / Tipo de factura */
  declare type: InvoiceType;
  /** Invoice status / Estado de la factura */
  declare status: InvoiceStatus;
  /** Total amount / Monto total */
  declare amount: number;
  /** Tax amount / Monto de impuestos */
  declare tax: number;
  /** Currency code (ISO 4217) / Código de moneda (ISO 4217) */
  declare currency: string;
  /** Line items / Ítems de línea */
  declare items: InvoiceItem[];
  /** Additional metadata / Metadatos adicionales */
  declare metadata: Record<string, unknown> | null;
  /** Date invoice was issued / Fecha de emisión */
  declare issuedAt: Date | null;
  /** Due date / Fecha de vencimiento */
  declare dueAt: Date | null;
  /** Payment date / Fecha de pago */
  declare paidAt: Date | null;
  /** Cancellation date / Fecha de cancelación */
  declare cancelledAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations / Asociaciones
  declare user?: User;
  declare order?: Order | null;
}

Invoice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'order_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    invoiceNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      // unique constraint managed via indexes (Sequelize v6 sync bug workaround)
      field: 'invoice_number',
    },
    type: {
      type: DataTypes.ENUM('subscription', 'purchase', 'upgrade'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'issued', 'paid', 'cancelled', 'overdue', 'refunded'),
      allowNull: false,
      defaultValue: 'draft',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    issuedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'issued_at',
    },
    dueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_at',
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at',
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cancelled_at',
    },
  },
  {
    sequelize,
    tableName: 'invoices',
    modelName: 'Invoice',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['order_id'] },
      { fields: ['invoice_number'], unique: true },
      { fields: ['status'] },
      { fields: ['issued_at'] },
      { fields: ['type'] },
    ],
  }
);
