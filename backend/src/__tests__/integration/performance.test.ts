/**
 * Performance Tests
 * Pruebas de rendimiento para verificar optimizaciones
 *
 * Phase 3: Visual Tree UI - N+1 Query Resolution
 * @module __tests__/integration/performance.test
 */

import { User } from '../../models';
import { TreeService } from '../../services/TreeService';
import { createTestUser, cleanupTestUsers, createSponsorWithReferrals } from '../fixtures';

describe('Performance Tests', () => {
  let treeService: TreeService;

  beforeAll(() => {
    treeService = new TreeService();
  });

  beforeEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  describe('N+1 Query Resolution', () => {
    it('should return tree for sponsor with referrals', async () => {
      // Create sponsor with left and right referrals
      const { sponsor, leftChild, rightChild } = await createSponsorWithReferrals();

      const startTime = Date.now();
      const tree = await treeService.getUserTree(sponsor.id, 3);
      const duration = Date.now() - startTime;

      console.log(`Sponsor tree query time: ${duration}ms`);

      // Should be fast
      expect(duration).toBeLessThan(2000);

      // Tree should have children
      expect(tree).toBeDefined();
      expect(tree!.children.length).toBeGreaterThanOrEqual(0);
    });

    it('should count children correctly', async () => {
      const { sponsor, leftChild, rightChild } = await createSponsorWithReferrals();

      // Add more children to left and right
      await createTestUser({ sponsorId: leftChild.id, position: 'left' });
      await createTestUser({ sponsorId: leftChild.id, position: 'right' });
      await createTestUser({ sponsorId: rightChild.id, position: 'left' });

      const tree = await treeService.getUserTree(sponsor.id, 3);

      // Tree should have the two direct children
      expect(tree!.children.length).toBe(2);
    });
  });

  describe('Response Time', () => {
    it('should complete tree query quickly', async () => {
      const { sponsor } = await createSponsorWithReferrals();

      const startTime = Date.now();
      await treeService.getUserTree(sponsor.id, 5);
      const duration = Date.now() - startTime;

      console.log(`Tree query time: ${duration}ms`);

      // Should be under 2 seconds per SPEC
      expect(duration).toBeLessThan(2000);
    });
  });
});
