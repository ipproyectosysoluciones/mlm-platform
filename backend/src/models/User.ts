/**
 * @fileoverview User Model - User entity for MLM platform
 * @description Sequelize model representing platform users with binary tree structure
 * @module models/User
 * @author MLM Development Team
 * @version 1.0.0
 * @example
 * // ES: Crear usuario
 * const user = await User.create({
 *   email: 'user@example.com',
 *   passwordHash: 'hashed_password',
 *   referralCode: 'REF123'
 * });
 *
 * // EN: Create user
 * const user = await User.create({
 *   email: 'user@example.com',
 *   passwordHash: 'hashed_password',
 *   referralCode: 'REF123'
 * });
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type { UserAttributes, UserCreationAttributes } from '../types';

type UserCreation = Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class User extends Model<UserAttributes, UserCreation> {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
  declare referralCode: string;
  declare sponsorId: string | null;
  declare position: 'left' | 'right' | null;
  declare level: number;
  declare status: 'active' | 'inactive';
  declare role: 'admin' | 'user';
  declare currency: 'USD' | 'COP' | 'MXN';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: [1, 255],
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    referralCode: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      field: 'referral_code',
    },
    sponsorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'sponsor_id',
    },
    position: {
      type: DataTypes.ENUM('left', 'right'),
      allowNull: true,
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    currency: {
      type: DataTypes.ENUM('USD', 'COP', 'MXN'),
      defaultValue: 'USD',
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user',
    },
  },
  {
    sequelize,
    tableName: 'users',
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['referral_code'] },
      { fields: ['sponsor_id'] },
      { fields: ['position'] },
    ],
  }
);
