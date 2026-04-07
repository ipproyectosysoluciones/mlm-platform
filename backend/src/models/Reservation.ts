/**
 * @fileoverview Reservation Model - Unified booking entity for Nexo Real
 * @description Sequelize model representing unified reservations for both property bookings
 *              and tour package bookings in the Nexo Real marketplace.
 *              Modelo Sequelize que representa reservas unificadas tanto para propiedades
 *              como para paquetes turísticos en el marketplace de Nexo Real.
 * @module models/Reservation
 * @author MLM Development Team
 *
 * @example
 * // English: Get pending property reservations for a user
 * const reservations = await Reservation.findAll({ where: { userId: 'uuid', type: 'property', status: 'pending' } });
 *
 * // Español: Obtener reservas de propiedad pendientes de un usuario
 * const reservations = await Reservation.findAll({ where: { userId: 'uuid', type: 'property', status: 'pending' } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// ============================================
// INTERFACES — Reservation Attributes
// ============================================

/**
 * Reservation attribute types — all columns on the table
 * Tipos de atributos de reserva — todas las columnas de la tabla
 */
export interface ReservationAttributes {
  id: string;
  /** Reservation type: property or tour / Tipo de reserva: propiedad o tour */
  type: 'property' | 'tour';
  /** Current status of the reservation / Estado actual de la reserva */
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  /** User who made the reservation / Usuario que hizo la reserva */
  userId: string;
  /** Vendor associated with the reservation / Vendedor asociado a la reserva */
  vendorId: string | null;

  // Property-specific fields — only used when type = 'property'
  /** Property being reserved / Propiedad reservada */
  propertyId: string | null;
  /** Check-in date (property) / Fecha de entrada (propiedad) */
  checkIn: string | null;
  /** Check-out date (property) / Fecha de salida (propiedad) */
  checkOut: string | null;

  // Tour-specific fields — only used when type = 'tour'
  /** Tour package being reserved / Paquete turístico reservado */
  tourPackageId: string | null;
  /** Date of the tour / Fecha del tour */
  tourDate: string | null;
  /** Number of people in the group / Número de personas en el grupo */
  groupSize: number;

  // Common guest fields
  /** Name of the main guest / Nombre del huésped principal */
  guestName: string;
  /** Guest contact email / Email de contacto del huésped */
  guestEmail: string;
  /** Guest phone number / Teléfono del huésped */
  guestPhone: string | null;

  // Pricing
  /** Total reservation price / Precio total de la reserva */
  totalPrice: number;
  /** Currency code (ISO 4217) / Código de moneda (ISO 4217) */
  currency: string;

  // Payment
  /** Payment status / Estado del pago */
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  /** External payment ID (PayPal/Stripe) / ID de pago externo */
  paymentId: string | null;

  // Notes
  /** Guest notes / Notas del huésped */
  notes: string | null;
  /** Internal admin notes / Notas internas del administrador */
  adminNotes: string | null;

  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creation attributes — fields that can be omitted on create
 * Atributos de creación — campos que pueden omitirse al crear
 */
export interface ReservationCreationAttributes extends Optional<
  ReservationAttributes,
  | 'id'
  | 'status'
  | 'vendorId'
  | 'propertyId'
  | 'checkIn'
  | 'checkOut'
  | 'tourPackageId'
  | 'tourDate'
  | 'groupSize'
  | 'guestPhone'
  | 'currency'
  | 'paymentStatus'
  | 'paymentId'
  | 'notes'
  | 'adminNotes'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
> {}

type ReservationCreation = Optional<
  ReservationAttributes,
  | 'id'
  | 'status'
  | 'vendorId'
  | 'propertyId'
  | 'checkIn'
  | 'checkOut'
  | 'tourPackageId'
  | 'tourDate'
  | 'groupSize'
  | 'guestPhone'
  | 'currency'
  | 'paymentStatus'
  | 'paymentId'
  | 'notes'
  | 'adminNotes'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Reservation Model - Unified booking for properties and tours in Nexo Real
 * Modelo Reservation - Reserva unificada para propiedades y tours en Nexo Real
 */
export class Reservation
  extends Model<ReservationAttributes, ReservationCreation>
  implements ReservationAttributes
{
  declare id: string;
  declare type: 'property' | 'tour';
  declare status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  declare userId: string;
  declare vendorId: string | null;

  // Property-specific
  declare propertyId: string | null;
  declare checkIn: string | null;
  declare checkOut: string | null;

  // Tour-specific
  declare tourPackageId: string | null;
  declare tourDate: string | null;
  declare groupSize: number;

  // Guest info
  declare guestName: string;
  declare guestEmail: string;
  declare guestPhone: string | null;

  // Pricing
  declare totalPrice: number;
  declare currency: string;

  // Payment
  declare paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  declare paymentId: string | null;

  // Notes
  declare notes: string | null;
  declare adminNotes: string | null;

  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Reservation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('property', 'tour'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
      defaultValue: 'pending',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'vendor_id',
      references: {
        model: 'vendors',
        key: 'id',
      },
    },

    // Property-specific
    propertyId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'property_id',
      references: {
        model: 'properties',
        key: 'id',
      },
    },
    checkIn: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'check_in',
    },
    checkOut: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'check_out',
    },

    // Tour-specific
    tourPackageId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'tour_package_id',
      references: {
        model: 'tour_packages',
        key: 'id',
      },
    },
    tourDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'tour_date',
    },
    groupSize: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'group_size',
    },

    // Guest info
    guestName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'guest_name',
    },
    guestEmail: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'guest_email',
    },
    guestPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'guest_phone',
    },

    // Pricing
    totalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'total_price',
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },

    // Payment
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
      defaultValue: 'pending',
      field: 'payment_status',
    },
    paymentId: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'payment_id',
    },

    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes',
    },

    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'reservations',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['user_id'] },
      { fields: ['vendor_id'] },
      { fields: ['property_id'] },
      { fields: ['tour_package_id'] },
      { fields: ['payment_status'] },
      { fields: ['tour_date'] },
      { fields: ['type', 'status'], name: 'reservations_type_status' },
    ],
  }
);
