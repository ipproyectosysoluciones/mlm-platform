/**
 * @fileoverview TourPackage Model - Tourism package entity for Nexo Real
 * @description Sequelize model representing tourism packages (adventure, cultural, etc.) in the marketplace.
 *              Modelo Sequelize que representa paquetes turísticos en el marketplace de Nexo Real.
 * @module models/TourPackage
 * @author MLM Development Team
 *
 * @example
 * // English: Get active adventure tours in Colombia
 * const tours = await TourPackage.findAll({ where: { type: 'adventure', status: 'active', country: 'Colombia' } });
 *
 * // Español: Obtener tours de aventura activos en Colombia
 * const tours = await TourPackage.findAll({ where: { type: 'adventure', status: 'active', country: 'Colombia' } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// ============================================
// INTERFACES — TourPackage Attributes
// ============================================

/**
 * TourPackage attribute types — all columns on the table
 * Tipos de atributos de paquete turístico — todas las columnas de la tabla
 */
export interface TourPackageAttributes {
  id: string;
  type: 'adventure' | 'cultural' | 'relaxation' | 'gastronomic' | 'ecotourism' | 'luxury';
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  destination: string;
  country: string;
  durationDays: number;
  price: number;
  currency: string;
  priceIncludes: unknown[];
  priceExcludes: unknown[];
  images: unknown[];
  maxCapacity: number;
  minGroupSize: number;
  status: 'active' | 'inactive' | 'draft';
  vendorId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creation attributes — fields that can be omitted on create
 * Atributos de creación — campos que pueden omitirse al crear
 */
export type TourPackageCreationAttributes = Optional<
  TourPackageAttributes,
  | 'id'
  | 'titleEn'
  | 'description'
  | 'descriptionEn'
  | 'country'
  | 'currency'
  | 'priceIncludes'
  | 'priceExcludes'
  | 'images'
  | 'maxCapacity'
  | 'minGroupSize'
  | 'status'
  | 'vendorId'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

type TourPackageCreation = Optional<
  TourPackageAttributes,
  | 'id'
  | 'titleEn'
  | 'description'
  | 'descriptionEn'
  | 'country'
  | 'currency'
  | 'priceIncludes'
  | 'priceExcludes'
  | 'images'
  | 'maxCapacity'
  | 'minGroupSize'
  | 'status'
  | 'vendorId'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * TourPackage Model - Represents a tourism package in Nexo Real
 * Modelo TourPackage - Representa un paquete turístico en Nexo Real
 */
export class TourPackage
  extends Model<TourPackageAttributes, TourPackageCreation>
  implements TourPackageAttributes
{
  declare id: string;
  declare type: 'adventure' | 'cultural' | 'relaxation' | 'gastronomic' | 'ecotourism' | 'luxury';
  declare title: string;
  declare titleEn: string | null;
  declare description: string | null;
  declare descriptionEn: string | null;
  declare destination: string;
  declare country: string;
  declare durationDays: number;
  declare price: number;
  declare currency: string;
  declare priceIncludes: unknown[];
  declare priceExcludes: unknown[];
  declare images: unknown[];
  declare maxCapacity: number;
  declare minGroupSize: number;
  declare status: 'active' | 'inactive' | 'draft';
  declare vendorId: string | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TourPackage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(
        'adventure',
        'cultural',
        'relaxation',
        'gastronomic',
        'ecotourism',
        'luxury'
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    titleEn: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'title_en',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    descriptionEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description_en',
    },
    destination: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'Colombia',
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'duration_days',
      validate: {
        min: 1,
      },
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    priceIncludes: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'price_includes',
    },
    priceExcludes: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'price_excludes',
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    maxCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      field: 'max_capacity',
    },
    minGroupSize: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'min_group_size',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'draft'),
      defaultValue: 'active',
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
    tableName: 'tour_packages',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['destination'] },
      { fields: ['country'] },
      { fields: ['status'] },
      { fields: ['vendor_id'] },
    ],
  }
);
