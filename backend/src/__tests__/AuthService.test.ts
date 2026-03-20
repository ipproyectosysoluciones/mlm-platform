jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../models');
jest.mock('../config/env');

import { hashPassword, verifyPassword, generateToken, verifyToken, extractTokenFromHeader } from '../services/AuthService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');
      const result = await hashPassword('password123');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(result).toBe('$2b$12$hashedpassword');
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await verifyPassword('password123', '$2b$12$hash');
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await verifyPassword('wrongpassword', '$2b$12$hash');
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token with user data', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');
      const result = generateToken(user as any);
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toBe('jwt-token');
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode token', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      const result = verifyToken('valid-token');
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(result).toEqual(payload);
    });

    it('should throw for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const result = extractTokenFromHeader('Bearer jwt-token');
      expect(result).toBe('jwt-token');
    });

    it('should return null for missing header', () => {
      const result = extractTokenFromHeader(undefined);
      expect(result).toBeNull();
    });

    it('should return null for non-Bearer header', () => {
      const result = extractTokenFromHeader('Basic token');
      expect(result).toBeNull();
    });
  });
});
