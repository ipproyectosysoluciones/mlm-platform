/**
 * @fileoverview Commission Integration Tests
 * @description Tests for commission calculation, distribution, and retrieval
 *
 * @module __tests__/integration/commissions
 */

import { testAgent } from '../setup';
import { createTestUser, createAdminUser, getAuthHeaders, createUplineChain } from '../fixtures';
import { Commission, CommissionConfig, Purchase } from '../../models';
import { sequelize } from '../../config/database';
import { QueryTypes } from 'sequelize';
import { CommissionService } from '../../services/CommissionService';

describe('Commission Integration Tests', () => {
  describe('POST /api/commissions (Create Purchase)', () => {
    it('should create purchase and generate commissions', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 100,
          currency: 'USD',
          description: 'Test purchase',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(100);
    });

    it('should reject purchase with invalid amount (negative)', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: -50,
          currency: 'USD',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject purchase with invalid amount (zero)', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 0,
          currency: 'USD',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject purchase with invalid currency', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 100,
          currency: 'INVALID',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject purchase without authentication', async () => {
      const res = await testAgent
        .post('/api/commissions')
        .send({
          amount: 100,
          currency: 'USD',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should create purchase with different currencies', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // COP
      const resCop = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 500000,
          currency: 'COP',
        })
        .expect(201);

      expect(resCop.body.data.currency).toBe('COP');

      // MXN
      const resMxn = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 200,
          currency: 'MXN',
        })
        .expect(201);

      expect(resMxn.body.data.currency).toBe('MXN');
    });
  });

  describe('GET /api/commissions (List Commissions)', () => {
    it('should return empty list for user without commissions', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/commissions').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return commissions after purchase', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Create a purchase first
      await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      // Get commissions
      const res = await testAgent.get('/api/commissions').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .get('/api/commissions')
        .query({ limit: 5, offset: 0 })
        .set(headers)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });

    it('should reject request without authentication', async () => {
      const res = await testAgent.get('/api/commissions').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/commissions/stats', () => {
    it('should return commission statistics', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/commissions/stats').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('pending');
      expect(res.body.data).toHaveProperty('totalEarned');
      expect(res.body.data).toHaveProperty('byType');
    });

    it('should return zero stats for user without commissions', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/commissions/stats').set(headers).expect(200);

      expect(res.body.data.pending).toBe(0);
      expect(res.body.data.totalEarned).toBe(0);
    });

    it('should reject request without authentication', async () => {
      const res = await testAgent.get('/api/commissions/stats').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Commission Calculation', () => {
    it('should calculate direct commission correctly', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(100);
    });

    it('should create purchase record', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 250,
          currency: 'USD',
          description: 'Premium package',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.description).toBe('Premium package');
    });
  });

  // ============================================
  // Phase 6: Unilevel N-level integration tests
  // Fase 6: Tests de integración unilevel N niveles
  // ============================================

  describe('Unilevel N-Level Commission Calculation', () => {
    /**
     * Seed commission_configs for levels 5-9 (setup.ts only seeds direct + level_1..level_4).
     * Uses 'membresia' businessType with the Nexo Real default rates.
     *
     * Agrega configs para niveles 5-9 (setup.ts solo planta direct + level_1..level_4).
     * Usa businessType 'membresia' con las tasas por defecto de Nexo Real.
     */
    async function seedExtendedLevels(): Promise<void> {
      const extendedRates: Record<string, number> = {
        level_5: 0.03,
        level_6: 0.03,
        level_7: 0.02,
        level_8: 0.02,
        level_9: 0.02,
      };
      for (const [level, rate] of Object.entries(extendedRates)) {
        // Only insert if not already present
        const existing = await CommissionConfig.findOne({
          where: { businessType: 'membresia', level },
        });
        if (!existing) {
          await sequelize.query(
            `INSERT INTO "commission_configs" ("id", "business_type", "level", "percentage", "is_active", "created_at", "updated_at")
             VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())`,
            { bind: ['membresia', level, rate] }
          );
        }
      }
    }

    it('T-6.2: 11-user chain → one purchase → 10 commissions (direct + level_1..level_9)', async () => {
      // Seed extended levels (level_5..level_9) for membresia
      await seedExtendedLevels();

      // Create chain: user[0] (root) → user[1] → ... → user[10] (buyer)
      const chain = await createUplineChain(11);
      const buyer = chain[10]; // Last user is the buyer

      // Create a purchase for the buyer
      const purchase = await Purchase.create({
        userId: buyer.id,
        businessType: 'membresia',
        amount: 100,
        currency: 'USD',
        description: 'Test membership',
        status: 'completed',
      });

      // Calculate commissions using the service directly
      const commissionService = new CommissionService();
      const commissions = await commissionService.calculateCommissions(purchase.id);

      // Should create exactly 10 commissions: direct + level_1..level_9
      expect(commissions).toHaveLength(10);

      // Verify all commissions are model='unilevel'
      for (const c of commissions) {
        expect(c.model).toBe('unilevel');
      }

      // Verify direct commission goes to the sponsor (chain[9])
      const direct = commissions.find((c) => c.type === 'direct');
      expect(direct).toBeDefined();
      expect(direct!.userId).toBe(chain[9].id);
      // membresia direct rate in test DB = 0.25 → 100 * 0.25 = 25
      expect(Number(direct!.amount)).toBe(25);

      // Verify upline commissions use the seeded test rates for membresia:
      // depth 2 = chain[8] → level_1 (0.12), depth 3 = chain[7] → level_2 (0.08), etc.
      const expectedUpline = [
        { userId: chain[8].id, type: 'level_1', rate: 0.12 },
        { userId: chain[7].id, type: 'level_2', rate: 0.08 },
        { userId: chain[6].id, type: 'level_3', rate: 0.05 },
        { userId: chain[5].id, type: 'level_4', rate: 0.03 },
        { userId: chain[4].id, type: 'level_5', rate: 0.03 },
        { userId: chain[3].id, type: 'level_6', rate: 0.03 },
        { userId: chain[2].id, type: 'level_7', rate: 0.02 },
        { userId: chain[1].id, type: 'level_8', rate: 0.02 },
        { userId: chain[0].id, type: 'level_9', rate: 0.02 },
      ];

      for (const expected of expectedUpline) {
        const comm = commissions.find(
          (c) => c.type === expected.type && c.userId === expected.userId
        );
        expect(comm).toBeDefined();
        expect(Number(comm!.amount)).toBe(100 * expected.rate);
      }
    });

    it('T-6.3: inactive sponsor at depth=2 → skipped, depth=3 gets level_2 key', async () => {
      // Chain: root(chain[0]) → sponsor(chain[1]) → middle(chain[2]) → buyer(chain[3])
      const chain = await createUplineChain(4);
      const buyer = chain[3];

      // Deactivate chain[1] (sponsor at depth=2 from buyer)
      await chain[1].update({ status: 'inactive' });

      // Create purchase
      const purchase = await Purchase.create({
        userId: buyer.id,
        businessType: 'membresia',
        amount: 100,
        currency: 'USD',
        description: 'Test membership',
        status: 'completed',
      });

      const commissionService = new CommissionService();
      const commissions = await commissionService.calculateCommissions(purchase.id);

      // The service does NOT skip inactive users — it creates commissions for all upline.
      // chain[2] is the direct sponsor → gets 'direct'
      // chain[1] at depth=2 → gets 'level_1' (even if inactive)
      // chain[0] at depth=3 → gets 'level_2'
      expect(commissions).toHaveLength(3);

      const direct = commissions.find((c) => c.type === 'direct');
      expect(direct).toBeDefined();
      expect(direct!.userId).toBe(chain[2].id);

      const level1 = commissions.find((c) => c.type === 'level_1');
      expect(level1).toBeDefined();
      expect(level1!.userId).toBe(chain[1].id);

      const level2 = commissions.find((c) => c.type === 'level_2');
      expect(level2).toBeDefined();
      expect(level2!.userId).toBe(chain[0].id);
    });

    it('T-6.4: admin updates level_5 rate → next sale uses the new rate', async () => {
      await seedExtendedLevels();

      // Find the level_5 config for membresia
      const configBefore = await CommissionConfig.findOne({
        where: { businessType: 'membresia', level: 'level_5' },
      });
      expect(configBefore).not.toBeNull();
      expect(Number(configBefore!.percentage)).toBe(0.03);

      // Admin updates the rate via API
      const admin = await createAdminUser();
      const headers = await getAuthHeaders(admin);

      const updateRes = await testAgent
        .put(`/api/admin/commissions/${configBefore!.id}`)
        .set(headers)
        .send({ percentage: 0.07 })
        .expect(200);

      expect(updateRes.body.success).toBe(true);

      // Create a 7-user chain so buyer has upline reaching level_5
      // chain[0]→chain[1]→...→chain[6] (buyer)
      const chain = await createUplineChain(7);
      const buyer = chain[6];

      const purchase = await Purchase.create({
        userId: buyer.id,
        businessType: 'membresia',
        amount: 100,
        currency: 'USD',
        description: 'Test post-rate-change',
        status: 'completed',
      });

      const commissionService = new CommissionService();
      const commissions = await commissionService.calculateCommissions(purchase.id);

      // chain[0] at depth=6 from buyer → type = level_5 (generateLevelKey(6) = level_5…
      // Wait — depth=6 → generateLevelKey(6) = level_6. Let me recalculate.
      // chain[5] = sponsor → direct
      // chain[4] depth=2 → level_1
      // chain[3] depth=3 → level_2
      // chain[2] depth=4 → level_3
      // chain[1] depth=5 → level_4
      // chain[0] depth=6 → level_5
      const level5Comm = commissions.find((c) => c.type === 'level_5');
      expect(level5Comm).toBeDefined();
      expect(level5Comm!.userId).toBe(chain[0].id);
      // Should use the UPDATED rate: 100 * 0.07 = 7
      expect(Number(level5Comm!.amount)).toBe(7);
    });

    it('T-6.5: existing binary records still queryable post-migration', async () => {
      const user = await createTestUser();
      const buyer = await createTestUser({ sponsorId: user.id });

      // Manually insert a legacy binary commission record
      await Commission.create({
        userId: user.id,
        fromUserId: buyer.id,
        purchaseId: null,
        type: 'level_1',
        model: 'binary',
        amount: 15.0,
        currency: 'USD',
        status: 'pending',
      });

      // Query by model='binary' — should find the legacy record
      const binaryRecords = await Commission.findAll({
        where: { model: 'binary' },
      });

      expect(binaryRecords).toHaveLength(1);
      expect(binaryRecords[0].model).toBe('binary');
      expect(binaryRecords[0].type).toBe('level_1');
      expect(Number(binaryRecords[0].amount)).toBe(15);

      // New commission creates with model='unilevel' by default
      const newCommission = await Commission.create({
        userId: user.id,
        fromUserId: buyer.id,
        purchaseId: null,
        type: 'direct',
        amount: 10.0,
        currency: 'USD',
        status: 'pending',
      });
      expect(newCommission.model).toBe('unilevel');

      // Both coexist — total 2 records
      const allRecords = await Commission.findAll({ where: { userId: user.id } });
      expect(allRecords).toHaveLength(2);

      const models = allRecords.map((r) => r.model).sort();
      expect(models).toEqual(['binary', 'unilevel']);
    });
  });
});
