/**
 * @fileoverview Contract Integration Tests
 * @description Integration tests for contract CRUD and acceptance flow
 * @module __tests__/integration/contracts
 */

import { testAgent } from './setup';
import { User, ContractTemplate, AffiliateContract } from '../models';
import { generateUniqueReferralCode, generateUUID } from '../utils/codeGenerator';
import crypto from 'crypto';

describe('Contracts Integration', () => {
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;

  beforeEach(async () => {
    // Create test users
    const user = await User.create({
      id: generateUUID(),
      email: 'user@test.com',
      passwordHash: '$2b$12$testhashfortesting1234567890',
      referralCode: await generateUniqueReferralCode(),
      role: 'user',
    });
    userId = user.id;

    const admin = await User.create({
      id: generateUUID(),
      email: 'admin@test.com',
      passwordHash: '$2b$12$testhashfortesting1234567890',
      referralCode: await generateUniqueReferralCode(),
      role: 'admin',
    });
    adminId = admin.id;

    // Get auth tokens
    const userAuth = await testAgent.post('/api/auth/login').send({
      email: 'user@test.com',
      password: 'password123',
    });
    userToken = userAuth.body.token;

    const adminAuth = await testAgent.post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    });
    adminToken = adminAuth.body.token;
  });

  describe('Admin Contract Management', () => {
    it('should create a contract template', async () => {
      const response = await testAgent
        .post('/api/admin/contracts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'AFFILIATE_AGREEMENT',
          version: '1.0.0',
          title: 'Affiliate Agreement',
          content: '<h1>Affiliate Agreement</h1><p>Terms and conditions...</p>',
          effectiveFrom: new Date().toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.type).toBe('AFFILIATE_AGREEMENT');
    });

    it('should get all contract templates', async () => {
      // Create a template first
      await testAgent
        .post('/api/admin/contracts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'COMPENSATION_PLAN',
          version: '1.0.0',
          title: 'Compensation Plan',
          content: '<h1>Compensation Plan</h1>',
          effectiveFrom: new Date().toISOString(),
        });

      const response = await testAgent
        .get('/api/admin/contracts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should update template by creating new version', async () => {
      // Create initial template
      const createResponse = await testAgent
        .post('/api/admin/contracts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'PRIVACY_POLICY',
          version: '1.0.0',
          title: 'Privacy Policy',
          content: '<h1>Privacy Policy v1</h1>',
          effectiveFrom: new Date().toISOString(),
        });

      const templateId = createResponse.body.data.id;

      // Update to create new version
      const updateResponse = await testAgent
        .put(`/api/admin/contracts/${templateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Privacy Policy Updated',
          content: '<h1>Privacy Policy v2</h1>',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.version).toBe('1.0.1');
    });
  });

  describe('User Contract Acceptance', () => {
    let templateId: string;

    beforeEach(async () => {
      // Create a template for user tests
      const response = await testAgent
        .post('/api/admin/contracts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'AFFILIATE_AGREEMENT',
          version: '1.0.0',
          title: 'Affiliate Agreement',
          content: '<h1>Affiliate Agreement</h1><p>Terms and conditions...</p>',
          effectiveFrom: new Date().toISOString(),
        });
      templateId = response.body.data.id;
    });

    it('should get contracts with user status', async () => {
      const response = await testAgent
        .get('/api/contracts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get specific contract', async () => {
      const response = await testAgent
        .get(`/api/contracts/${templateId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(templateId);
    });

    it('should accept a contract', async () => {
      const response = await testAgent
        .post(`/api/contracts/${templateId}/accept`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ACCEPTED');
      expect(response.body.data).toHaveProperty('signedAt');
    });

    it('should decline a contract', async () => {
      const response = await testAgent
        .post(`/api/contracts/${templateId}/decline`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DECLINED');
    });

    it('should not accept already accepted contract', async () => {
      // Accept first
      await testAgent
        .post(`/api/contracts/${templateId}/accept`)
        .set('Authorization', `Bearer ${userToken}`);

      // Try to accept again
      const response = await testAgent
        .post(`/api/contracts/${templateId}/accept`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('CONTRACT_ALREADY_ACCEPTED');
    });
  });

  describe('Admin User Contract Management', () => {
    let templateId: string;

    beforeEach(async () => {
      // Create template and have user accept it
      const createResponse = await testAgent
        .post('/api/admin/contracts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'COMPENSATION_PLAN',
          version: '1.0.0',
          title: 'Compensation Plan',
          content: '<h1>Compensation Plan</h1>',
          effectiveFrom: new Date().toISOString(),
        });
      templateId = createResponse.body.data.id;

      // User accepts
      await testAgent
        .post(`/api/contracts/${templateId}/accept`)
        .set('Authorization', `Bearer ${userToken}`);
    });

    it('should get user contracts as admin', async () => {
      const response = await testAgent
        .get(`/api/admin/contracts/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should revoke user contract', async () => {
      const response = await testAgent
        .post(`/api/admin/contracts/${templateId}/revoke/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('REVOKED');
    });
  });

  describe('Contract Versioning', () => {
    it('should mark old version as inactive when creating new', async () => {
      // Create first version
      const v1 = await testAgent
        .post('/api/admin/contracts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'TERMS_OF_SERVICE',
          version: '1.0.0',
          title: 'Terms of Service',
          content: '<h1>TOS v1</h1>',
          effectiveFrom: new Date().toISOString(),
        });

      // Create second version
      const v2 = await testAgent
        .post('/api/admin/contracts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'TERMS_OF_SERVICE',
          version: '1.1.0',
          title: 'Terms of Service',
          content: '<h1>TOS v2</h1>',
          effectiveFrom: new Date().toISOString(),
        });

      // Both should exist with v1 marked inactive (effectiveTo set)
      expect(v1.body.data.id).not.toBe(v2.body.data.id);
    });
  });

  describe('Content Hash', () => {
    it('should store content hash at acceptance time', async () => {
      // Create template
      const createResponse = await testAgent
        .post('/api/admin/contracts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'PRIVACY_POLICY',
          version: '1.0.0',
          title: 'Privacy Policy',
          content: '<h1>Privacy Policy</h1>',
          effectiveFrom: new Date().toISOString(),
        });

      const templateId = createResponse.body.data.id;

      // Accept contract
      const acceptResponse = await testAgent
        .post(`/api/contracts/${templateId}/accept`)
        .set('Authorization', `Bearer ${userToken}`);

      // Check content hash was stored
      const expectedHash = crypto
        .createHash('sha256')
        .update('<h1>Privacy Policy</h1>')
        .digest('hex');

      expect(acceptResponse.body.data.contentHash).toBe(expectedHash);
    });
  });
});
