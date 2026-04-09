/**
 * @fileoverview Two-Factor Authentication Database Migration
 * @description Add 2FA columns to users table
 *             Agrega columnas 2FA a la tabla users
 * @module database/migrations/twoFactorAuth
 */

import { sequelize } from '../../config/database';

/**
 * Migration: Add 2FA columns to users table
 * Agrega columnas de autenticación de dos factores a la tabla users
 */
export async function up(): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Running 2FA migration...');

  try {
    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('users');

    // Add two_factor_secret_encrypted
    if (!tableDescription.two_factor_secret_encrypted) {
      await queryInterface.addColumn('users', 'two_factor_secret_encrypted', {
        type: 'TEXT',
        allowNull: true,
        comment: 'Encrypted TOTP secret for 2FA',
      });
      console.log('✓ Added two_factor_secret_encrypted');
    } else {
      console.log('→ two_factor_secret_encrypted already exists');
    }

    // Add two_factor_recovery_codes_hash
    if (!tableDescription.two_factor_recovery_codes_hash) {
      await queryInterface.addColumn('users', 'two_factor_recovery_codes_hash', {
        type: 'TEXT',
        allowNull: true,
        comment: 'JSON array of bcrypt-hashed recovery codes',
      });
      console.log('✓ Added two_factor_recovery_codes_hash');
    } else {
      console.log('→ two_factor_recovery_codes_hash already exists');
    }

    // Add two_factor_enabled_at
    if (!tableDescription.two_factor_enabled_at) {
      await queryInterface.addColumn('users', 'two_factor_enabled_at', {
        type: 'TIMESTAMP',
        allowNull: true,
        comment: 'When 2FA was enabled',
      });
      console.log('✓ Added two_factor_enabled_at');
    } else {
      console.log('→ two_factor_enabled_at already exists');
    }

    // Add two_factor_failed_attempts
    if (!tableDescription.two_factor_failed_attempts) {
      await queryInterface.addColumn('users', 'two_factor_failed_attempts', {
        type: 'INTEGER',
        allowNull: false,
        defaultValue: 0,
        comment: 'Failed 2FA verification attempts',
      });
      console.log('✓ Added two_factor_failed_attempts');
    } else {
      console.log('→ two_factor_failed_attempts already exists');
    }

    // Add two_factor_locked_until
    if (!tableDescription.two_factor_locked_until) {
      await queryInterface.addColumn('users', 'two_factor_locked_until', {
        type: 'TIMESTAMP',
        allowNull: true,
        comment: 'Account lockout until this time',
      });
      console.log('✓ Added two_factor_locked_until');
    } else {
      console.log('→ two_factor_locked_until already exists');
    }

    console.log('2FA migration completed successfully!');
  } catch (error) {
    console.error('2FA migration failed:', error);
    throw error;
  }
}

/**
 * Rollback: Remove 2FA columns
 * Remueve las columnas 2FA de la tabla users
 */
export async function down(): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Rolling back 2FA migration...');

  try {
    await queryInterface.removeColumn('users', 'two_factor_locked_until');
    console.log('✓ Removed two_factor_locked_until');

    await queryInterface.removeColumn('users', 'two_factor_failed_attempts');
    console.log('✓ Removed two_factor_failed_attempts');

    await queryInterface.removeColumn('users', 'two_factor_enabled_at');
    console.log('✓ Removed two_factor_enabled_at');

    await queryInterface.removeColumn('users', 'two_factor_recovery_codes_hash');
    console.log('✓ Removed two_factor_recovery_codes_hash');

    await queryInterface.removeColumn('users', 'two_factor_secret_encrypted');
    console.log('✓ Removed two_factor_secret_encrypted');

    console.log('2FA rollback completed successfully!');
  } catch (error) {
    console.error('2FA rollback failed:', error);
    throw error;
  }
}

// Run if called directly
import { fileURLToPath } from 'url';

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  (async () => {
    try {
      await up();
      console.log('Migration complete!');
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}

export default { up, down };
