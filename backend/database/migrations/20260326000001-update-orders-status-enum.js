'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // sequelize-cli does not wrap migrations in a transaction by default; this migration
    // rewrites columns and enum types, so it must be atomic — wrap everything explicitly.
    const t = await queryInterface.sequelize.transaction();
    const sql = (q) => queryInterface.sequelize.query(q, { transaction: t });
    try {
      // 1. Change status ENUM: ('pending','completed','cancelled','refunded') → ('pending','completed','failed')
      //    PostgreSQL cannot change an enum's value list in place. Sequelize's changeColumn with an
      //    ENUM type calls pgEnum(), whose CREATE TYPE silently swallows duplicate_object — so the
      //    column would keep the old values while the migration "succeeds". Use the rename dance:
      //    create the new type, cast the column, drop the old type. All statements are transactional
      //    (no ALTER TYPE ... ADD VALUE involved).
      await sql('ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;');
      await sql('ALTER TYPE "enum_orders_status" RENAME TO "enum_orders_status_old";');
      await sql(`CREATE TYPE "enum_orders_status" AS ENUM ('pending', 'completed', 'failed');`);
      await sql(
        `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "enum_orders_status" USING "status"::text::"enum_orders_status";`
      );
      await sql(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';`);
      await sql(`DROP TYPE "enum_orders_status_old";`);

      // 2. Rename column amount to total_amount
      await queryInterface.renameColumn('orders', 'amount', 'total_amount', { transaction: t });

      // 3. Change payment_method column to ENUM, aligned with the Order model.
      //    Plain changeColumn() fails on PG ("default ... cannot be cast automatically"):
      //    it emits SET DEFAULT before the TYPE cast. Order the statements manually.
      await sql('ALTER TABLE "orders" ALTER COLUMN "payment_method" DROP DEFAULT;');
      await sql('ALTER TABLE "orders" ALTER COLUMN "payment_method" SET NOT NULL;');
      await sql(
        `CREATE TYPE "enum_orders_payment_method" AS ENUM ('manual', 'simulated', 'paypal', 'mercadopago');`
      );
      await sql(
        `ALTER TABLE "orders" ALTER COLUMN "payment_method" TYPE "enum_orders_payment_method" USING "payment_method"::text::"enum_orders_payment_method";`
      );
      await sql(`ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DEFAULT 'simulated';`);

      // 4. Add notes column
      await queryInterface.addColumn(
        'orders',
        'notes',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction: t }
      );

      // 5. Remove extra columns if they exist (transaction_id, stream_url, stream_token, expires_at)
      // Since these columns may not exist, we check for them in a safe way.
      // We'll attempt to remove them; if they don't exist, the operation will fail but we can ignore.
      // For simplicity, we'll skip removal for now as they are not in the migration.

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    const sql = (q) => queryInterface.sequelize.query(q, { transaction: t });
    try {
      // Restore the original 4-value status ENUM (rename dance, mirrored from up())
      await sql('ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;');
      await sql('ALTER TYPE "enum_orders_status" RENAME TO "enum_orders_status_tmp";');
      await sql(
        `CREATE TYPE "enum_orders_status" AS ENUM ('pending', 'completed', 'cancelled', 'refunded');`
      );
      await sql(
        `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "enum_orders_status" USING "status"::text::"enum_orders_status";`
      );
      await sql(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';`);
      await sql(`DROP TYPE "enum_orders_status_tmp";`);

      await queryInterface.renameColumn('orders', 'total_amount', 'amount', { transaction: t });

      // Restore payment_method to its original VARCHAR(50) nullable form (enum → varchar
      // needs an explicit USING cast; changeColumn() emits none and would fail).
      await sql('ALTER TABLE "orders" ALTER COLUMN "payment_method" DROP DEFAULT;');
      await sql('ALTER TABLE "orders" ALTER COLUMN "payment_method" DROP NOT NULL;');
      await sql(
        `ALTER TABLE "orders" ALTER COLUMN "payment_method" TYPE VARCHAR(50) USING "payment_method"::text;`
      );
      await sql(`DROP TYPE IF EXISTS "enum_orders_payment_method";`);

      await queryInterface.removeColumn('orders', 'notes', { transaction: t });

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
};
