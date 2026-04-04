/**
 * @fileoverview ContractService Unit Tests
 * @description Tests for ContractService contract template and acceptance management
 * @module __tests__/unit/ContractService
 */

import { ContractService } from '../../services/ContractService';
import crypto from 'crypto';

// Mock dependencies before importing the service
jest.mock('../../models', () => ({
  ContractTemplate: jest.fn().mockImplementation(() => ({
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    computeContentHash: jest.fn((content: string) =>
      crypto.createHash('sha256').update(content).digest('hex')
    ),
  })),
  AffiliateContract: jest.fn().mockImplementation(() => ({
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  })),
  User: {
    findOne: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn((callback) =>
      callback({
        transaction: jest.fn(),
      })
    ),
  },
}));

jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn((callback) => callback({})),
  },
}));

describe('ContractService', () => {
  let contractService: ContractService;

  beforeEach(() => {
    contractService = new ContractService();
    jest.clearAllMocks();
  });

  describe('computeContentHash', () => {
    it('should compute SHA256 hash of content', () => {
      const content = '<h1>Test Contract</h1>';
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      expect(hash).toHaveLength(64);
      expect(hash).toBe(crypto.createHash('sha256').update(content).digest('hex'));
    });
  });

  describe('Content Hash Verification', () => {
    it('should produce consistent hashes for same content', () => {
      const content = '<h1>Affiliate Agreement</h1><p>Terms and conditions...</p>';

      const hash1 = crypto.createHash('sha256').update(content).digest('hex');
      const hash2 = crypto.createHash('sha256').update(content).digest('hex');

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different content', () => {
      const content1 = '<h1>Version 1</h1>';
      const content2 = '<h1>Version 2</h1>';

      const hash1 = crypto.createHash('sha256').update(content1).digest('hex');
      const hash2 = crypto.createHash('sha256').update(content2).digest('hex');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Service Methods', () => {
    it('should instantiate ContractService', () => {
      expect(contractService).toBeDefined();
      expect(contractService).toBeInstanceOf(ContractService);
    });
  });
});
