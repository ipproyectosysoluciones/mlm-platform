/**
 * @fileoverview TourAvailability Model - Availability calendar for tourism packages
 * @description Sequelize model representing available dates and spots for a tour package.
 *              Modelo Sequelize que representa fechas y cupos disponibles para un paquete turístico.
 * @module models/TourAvailability
 * @author MLM Development Team
 *
 * @example
 * // English: Get available spots for a tour on a specific date
 * const availability = await TourAvailability.findOne({ where: { tourPackageId: 'uuid', date: '2026-07-15' } });
 *
 * // Español: Obtener cupos disponibles para un tour en una fecha específica
 * const availability = await TourAvailability.findOne({ where: { tourPackageId: 'uuid', date: '2026-07-15' } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// ============================================
// INTERFACES — TourAvailability Attributes
// ============================================

/**
 * TourAvailability attribute types — all columns on the table
 * Tipos de atributos de disponibilidad turística — todas las columnas de la tabla
 */
export interface TourAvailabilityAttributes {
  id: string;
  tourPackageId: string;
  date: string;
  availableSpots: number;
  bookedSpots: number;
  isBlocked: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creation attributes — fields that can be omitted on create
 * Atributos de creación — campos que pueden omitirse al crear
 */
export interface TourAvailabilityCreationAttributes extends Optional<
  TourAvailabilityAttributes,
  'id' | 'bookedSpots' | 'isBlocked' | 'notes' | 'createdAt' | 'updatedAt'
> {}

type TourAvailabilityCreation = Optional<
  TourAvailabilityAttributes,
  'id' | 'bookedSpots' | 'isBlocked' | 'notes' | 'createdAt' | 'updatedAt'
>;

/**
 * TourAvailability Model - Represents availability calendar for a tour package
 * Modelo TourAvailability - Representa el calendario de disponibilidad de un paquete turístico
 */
export class TourAvailability
  extends Model<TourAvailabilityAttributes, TourAvailabilityCreation>
  implements TourAvailabilityAttributes
{
  declare id: string;
  declare tourPackageId: string;
  declare date: string;
  declare availableSpots: number;
  declare bookedSpots: number;
  declare isBlocked: boolean;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TourAvailability.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tourPackageId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tour_package_id',
      references: {
        model: 'tour_packages',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    availableSpots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'available_spots',
      validate: {
        min: 0,
      },
    },
    bookedSpots: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'booked_spots',
      validate: {
        min: 0,
      },
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_blocked',
    },
    notes: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    tableName: 'tour_availabilities',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['tour_package_id'] },
      {
        unique: true,
        fields: ['tour_package_id', 'date'],
        name: 'tour_availabilities_package_date_unique',
      },
    ],
  }
);
