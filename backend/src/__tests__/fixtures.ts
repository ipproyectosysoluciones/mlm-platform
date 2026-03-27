/**
 * @fileoverview Test fixtures for integration tests
 * @description Provides reusable factory functions for creating test data
 *
 * @module __tests__/fixtures
 */

import { User, UserClosure } from '../models';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';
import { treeServiceInstance } from '../services/UserService';

/**
 * Create a test user with valid credentials
 * Populates the closure table if sponsorId is provided
 */
export async function createTestUser(
  overrides: {
    email?: string;
    password?: string;
    role?: 'admin' | 'user';
    sponsorId?: string | null;
    position?: 'left' | 'right' | null;
    referralCode?: string;
  } = {}
): Promise<User> {
  const password = overrides.password || 'TestPass123!';
  const passwordHash = await bcrypt.hash(password, 12);
  const unique = Math.random().toString(36).substring(7);

  const user = await User.create({
    email: overrides.email || `test_${Date.now()}_${unique}@mlm.test`,
    passwordHash,
    referralCode: overrides.referralCode || `REF${unique.toUpperCase()}`,
    sponsorId: overrides.sponsorId || null,
    position: overrides.position || null,
    level: 1,
    status: 'active',
    role: overrides.role || 'user',
    currency: 'USD',
  } as any);

  // Populate closure table if sponsorId is provided
  // This is required for tree-related tests to work
  if (overrides.sponsorId) {
    const sponsor = await User.findByPk(overrides.sponsorId);
    if (sponsor) {
      // Insert ancestor path from sponsor to user
      // First get sponsor's ancestors
      const sponsorAncestors = await sequelize.query(
        `SELECT ancestor_id, depth FROM user_closure WHERE descendant_id = :sponsorId`,
        {
          replacements: { sponsorId: overrides.sponsorId },
          type: 'SELECT' as any,
        }
      );

      // Add sponsor as direct ancestor (depth + 1)
      await UserClosure.create({
        ancestorId: overrides.sponsorId,
        descendantId: user.id,
        depth: 1,
      });

      // Add all sponsor's ancestors with incremented depth
      const ancestors = sponsorAncestors as unknown as { ancestor_id: string; depth: number }[];
      for (const anc of ancestors) {
        await UserClosure.create({
          ancestorId: anc.ancestor_id,
          descendantId: user.id,
          depth: anc.depth + 1,
        });
      }
    }
  }

  return user;
}

/**
 * Create an admin user for testing
 */
export async function createAdminUser(): Promise<User> {
  const unique = Math.random().toString(36).substring(7).toUpperCase();
  return createTestUser({
    email: `admin_${Date.now()}_${unique}@mlm.test`,
    role: 'admin',
    referralCode: `ADM${unique}`,
  });
}

/**
 * Create a regular user for testing
 */
export async function createRegularUser(): Promise<User> {
  const unique = Math.random().toString(36).substring(7).toUpperCase();
  return createTestUser({
    email: `user_${Date.now()}_${unique}@mlm.test`,
    role: 'user',
    referralCode: `USR${unique}`,
  });
}

/**
 * Create sponsor with referred users for tree testing
 */
export async function createSponsorWithReferrals(): Promise<{
  sponsor: User;
  leftChild: User;
  rightChild: User;
}> {
  const unique = Math.random().toString(36).substring(7).toUpperCase();

  const sponsor = await createTestUser({
    email: `sponsor_${Date.now()}_${unique}@mlm.test`,
    referralCode: `SPO${unique}`,
  });

  const leftChild = await createTestUser({
    email: `left_${Date.now()}_${unique}@mlm.test`,
    sponsorId: sponsor.id,
    position: 'left',
  });

  const rightChild = await createTestUser({
    email: `right_${Date.now()}_${unique}@mlm.test`,
    sponsorId: sponsor.id,
    position: 'right',
  });

  return { sponsor, leftChild, rightChild };
}

/**
 * Get auth token for a user
 */
export function getAuthToken(user: User): string {
  const { generateToken } = require('../services/AuthService');
  return generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Get auth headers for a user
 */
export function getAuthHeaders(user: User): Record<string, string> {
  const token = getAuthToken(user);
  return { Authorization: `Bearer ${token}` };
}

/**
 * Cleanup test users - deletes all test users created during tests
 */
export async function cleanupTestUsers(): Promise<void> {
  await sequelize.query(`
    DELETE FROM user_closure 
    WHERE descendant_id IN (
      SELECT id FROM users WHERE email LIKE '%@mlm.test'
    )
  `);
  await sequelize.query(`
    DELETE FROM users WHERE email LIKE '%@mlm.test'
  `);
}
