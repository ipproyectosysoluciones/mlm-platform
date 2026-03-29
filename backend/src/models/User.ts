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
  // Notification preferences
  declare emailNotifications: boolean;
  declare smsNotifications: boolean;
  declare twoFactorEnabled: boolean;
  declare twoFactorPhone: string | null;
  declare weeklyDigest: boolean;
  // 2FA fields
  declare twoFactorSecretEncrypted: string | null;
  declare twoFactorRecoveryCodesHash: string | null;
  declare twoFactorEnabledAt: Date | null;
  declare twoFactorFailedAttempts: number;
  declare twoFactorLockedUntil: Date | null;
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
    // Notification preferences / Preferencias de notificación
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'email_notifications',
    },
    smsNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'sms_notifications',
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_enabled',
    },
    twoFactorPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'two_factor_phone',
    },
    weeklyDigest: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'weekly_digest',
    },
    // 2FA additional fields / Campos adicionales 2FA
    twoFactorSecretEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'two_factor_secret_encrypted',
      comment: 'Encrypted TOTP secret',
    },
    twoFactorRecoveryCodesHash: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'two_factor_recovery_codes_hash',
      comment: 'JSON array of bcrypt-hashed recovery codes',
    },
    twoFactorEnabledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'two_factor_enabled_at',
      comment: 'When 2FA was enabled',
    },
    twoFactorFailedAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'two_factor_failed_attempts',
      comment: 'Failed 2FA verification attempts',
    },
    twoFactorLockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'two_factor_locked_until',
      comment: 'Account lockout until this time',
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
