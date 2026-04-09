/**
 * @fileoverview Property Model - Real estate property entity for Nexo Real
 * @description Sequelize model representing properties (rental, sale, management) in the marketplace
 * @module models/Property
 * @author MLM Development Team
 *
 * @example
 * // English: Get available properties in a city
 * const properties = await Property.findAll({ where: { city: 'Bogotá', status: 'available' } });
 *
 * // Español: Obtener propiedades disponibles en una ciudad
 * const properties = await Property.findAll({ where: { city: 'Bogotá', status: 'available' } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// ============================================
// INTERFACES — Property Attributes
// ============================================

/**
 * Property attribute types — all columns on the table
 * Tipos de atributos de propiedad — todas las columnas de la tabla
 */
export interface PropertyAttributes {
  id: string;
  type: 'rental' | 'sale' | 'management';
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  price: number;
  currency: string;
  priceNegotiable: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  address: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  amenities: unknown[];
  images: unknown[];
  status: 'available' | 'rented' | 'sold' | 'paused';
  vendorId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creation attributes — fields that can be omitted on create
 * Atributos de creación — campos que pueden omitirse al crear
 */
export type PropertyCreationAttributes = Optional<
  PropertyAttributes,
  | 'id'
  | 'titleEn'
  | 'description'
  | 'descriptionEn'
  | 'currency'
  | 'priceNegotiable'
  | 'bedrooms'
  | 'bathrooms'
  | 'areaM2'
  | 'country'
  | 'lat'
  | 'lng'
  | 'amenities'
  | 'images'
  | 'status'
  | 'vendorId'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

type PropertyCreation = Optional<
  PropertyAttributes,
  | 'id'
  | 'titleEn'
  | 'description'
  | 'descriptionEn'
  | 'currency'
  | 'priceNegotiable'
  | 'bedrooms'
  | 'bathrooms'
  | 'areaM2'
  | 'country'
  | 'lat'
  | 'lng'
  | 'amenities'
  | 'images'
  | 'status'
  | 'vendorId'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Property Model - Represents a real estate property in Nexo Real
 * Modelo de Propiedad - Representa una propiedad inmobiliaria en Nexo Real
 */
export class Property
  extends Model<PropertyAttributes, PropertyCreation>
  implements PropertyAttributes
{
  declare id: string;
  declare type: 'rental' | 'sale' | 'management';
  declare title: string;
  declare titleEn: string | null;
  declare description: string | null;
  declare descriptionEn: string | null;
  declare price: number;
  declare currency: string;
  declare priceNegotiable: boolean;
  declare bedrooms: number | null;
  declare bathrooms: number | null;
  declare areaM2: number | null;
  declare address: string;
  declare city: string;
  declare country: string;
  declare lat: number | null;
  declare lng: number | null;
  declare amenities: unknown[];
  declare images: unknown[];
  declare status: 'available' | 'rented' | 'sold' | 'paused';
  declare vendorId: string | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Property.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('rental', 'sale', 'management'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },
    titleEn: {
      type: DataTypes.STRING(255),
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
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'COP',
    },
    priceNegotiable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'price_negotiable',
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    areaM2: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'area_m2',
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'Colombia',
    },
    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    lng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    amenities: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('available', 'rented', 'sold', 'paused'),
      defaultValue: 'available',
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
    tableName: 'properties',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['city'] },
      { fields: ['type'] },
      { fields: ['vendor_id'] },
    ],
  }
);
