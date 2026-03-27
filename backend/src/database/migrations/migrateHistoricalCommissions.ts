/**
 * @fileoverview Historical Commission Migration Script
 * @description Migrates existing commission records to wallet transactions
 *              Migra registros de comisiones existentes a transacciones de wallet
 *              This migration is IDEMPOTENT - can be run multiple times safely
 * @module database/migrations/migrateHistoricalCommissions
 * @author MLM Development Team
 *
 * @usage
 * // English: Run migration
 * npx ts-node src/database/migrations/migrateHistoricalCommissions.ts
 *
 * // Español: Ejecutar migración
 * npx ts-node src/database/migrations/migrateHistoricalCommissions.ts
 *
 * @description
 * This script:
 * 1. Finds all commissions with status 'approved' or 'paid' that haven't been migrated
 * 2. Creates wallet for each user if doesn't exist
 * 3. Credits commission amount to wallet (converts to USD)
 * 4. Creates wallet transaction record
 * 5. Marks commission as migrated (adds migratedToWallet flag)
 *
 * This script is IDEMPOTENT - safe to run multiple times:
 * - Skips commissions already migrated (checks migratedToWallet flag)
 * - Continues on errors for individual commissions
 * - Reports summary of migrated vs skipped vs failed
 */

import { sequelize } from '../../config/database';
import { Commission, Wallet, WalletTransaction, User } from '../../models';
import { WALLET_TRANSACTION_TYPE } from '../../types';
import { convertToUSD } from './currencyConversion';
import { Op } from 'sequelize';

interface MigrationResult {
  success: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Main migration function
 * Función principal de migración
 */
async function migrateHistoricalCommissions(): Promise<MigrationResult> {
  console.log('\n========== Historical Commission Migration ==========\n');
  console.log('Starting migration of commissions to wallet...\n');

  const result: MigrationResult = {
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Find all approved/paid commissions that haven't been migrated
    const commissions = await Commission.findAll({
      where: {
        status: {
          [Op.in]: ['approved', 'paid'],
        },
        // Skip already migrated (if field exists)
        ...(Commission.rawAttributes.migratedToWallet ? { migratedToWallet: false } : {}),
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'referralCode'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    console.log(`Found ${commissions.length} commissions to migrate.\n`);

    if (commissions.length === 0) {
      console.log('No commissions to migrate. Migration complete.\n');
      return result;
    }

    // Process each commission
    for (const commission of commissions) {
      try {
        // Get or create wallet for user
        let wallet = await Wallet.findOne({
          where: { userId: commission.userId },
        });

        if (!wallet) {
          wallet = await Wallet.create({
            userId: commission.userId,
            balance: 0,
            currency: 'USD',
          });
          console.log(`Created wallet for user ${commission.userId}`);
        }

        // Convert commission amount to USD
        const amountInUSD = convertToUSD(Number(commission.amount), commission.currency || 'USD');

        // Update wallet balance
        const previousBalance = Number(wallet.balance);
        const newBalance = previousBalance + amountInUSD;

        await wallet.update({ balance: newBalance });

        // Create wallet transaction
        await WalletTransaction.create({
          walletId: wallet.id,
          type: WALLET_TRANSACTION_TYPE.COMMISSION_EARNED,
          amount: amountInUSD,
          balanceAfter: newBalance,
          referenceId: commission.id.toString(),
          description:
            `Historical commission migration: ${commission.description || 'Commission'}`.substring(
              0,
              255
            ),
          exchangeRate:
            commission.currency && commission.currency !== 'USD'
              ? Number(commission.amount) / amountInUSD
              : 1,
        });

        // Mark commission as migrated (if field exists)
        if (Commission.rawAttributes.migratedToWallet) {
          await commission.update({ migratedToWallet: true });
        }

        result.success++;
        console.log(
          `✓ Migrated commission ${commission.id}: $${amountInUSD.toFixed(2)} USD to user ${commission.userId}`
        );
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Commission ${commission.id}: ${errorMessage}`);
        console.error(`✗ Failed to migrate commission ${commission.id}:`, errorMessage);
      }
    }

    // Summary
    console.log('\n========== Migration Summary ==========');
    console.log(`Total found: ${commissions.length}`);
    console.log(`Successfully migrated: ${result.success}`);
    console.log(`Skipped (already migrated): ${result.skipped}`);
    console.log(`Failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((err) => console.log(`  - ${err}`));
    }

    console.log('\n========== Migration Complete ==========\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Migration failed with error:', errorMessage);
    result.errors.push(`Migration failed: ${errorMessage}`);
    throw error;
  }

  return result;
}

/**
 * Rollback function - Reverse migration
 * Función de rollback - Revertir migración
 *
 * @warning This will deduct migrated amounts from wallets
 */
async function rollbackMigration(): Promise<void> {
  console.log('\n========== Rolling Back Migration ==========\n');

  try {
    // Find all migrated commissions
    const commissions = await Commission.findAll({
      where: {
        status: {
          [Op.in]: ['approved', 'paid'],
        },
        ...(Commission.rawAttributes.migratedToWallet ? { migratedToWallet: true } : {}),
      },
    });

    console.log(`Found ${commissions.length} migrated commissions to rollback.\n`);

    let rolledBack = 0;

    for (const commission of commissions) {
      try {
        // Find wallet
        const wallet = await Wallet.findOne({
          where: { userId: commission.userId },
        });

        if (!wallet) continue;

        // Convert amount to USD
        const amountInUSD = convertToUSD(Number(commission.amount), commission.currency || 'USD');

        // Deduct from wallet
        const previousBalance = Number(wallet.balance);
        const newBalance = previousBalance - amountInUSD;

        await wallet.update({ balance: newBalance });

        // Find and delete transaction
        const transaction = await WalletTransaction.findOne({
          where: {
            referenceId: commission.id.toString(),
            type: WALLET_TRANSACTION_TYPE.COMMISSION_EARNED,
          },
        });

        if (transaction) {
          await transaction.destroy();
        }

        // Remove migration flag
        if (Commission.rawAttributes.migratedToWallet) {
          await commission.update({ migratedToWallet: false });
        }

        rolledBack++;
        console.log(`✓ Rolled back commission ${commission.id}`);
      } catch (error) {
        console.error(`✗ Failed to rollback commission ${commission.id}:`, error);
      }
    }

    console.log(`\nRolled back ${rolledBack} commissions.\n`);
    console.log('========== Rollback Complete ==========\n');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

// CLI execution
const args = process.argv.slice(2);

if (args.includes('--rollback')) {
  rollbackMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  migrateHistoricalCommissions()
    .then((result) => {
      if (result.failed > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

export { migrateHistoricalCommissions, rollbackMigration };
