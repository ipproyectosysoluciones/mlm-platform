jest.mock('../models');

jest.mock('../services/TreeService', () => ({
  TreeService: jest.fn().mockImplementation(() => ({
    findAvailablePosition: jest.fn().mockResolvedValue('left'),
    insertWithClosure: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { UserService } from '../services/UserService';
import { User } from '../models';

describe('UserService', () => {
  let userService: UserService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    referralCode: 'TEST-ABC1',
    sponsorId: 'sponsor-456',
    level: 1,
    position: 'left' as const,
    status: 'active' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  describe('createUser', () => {
    it('should create user without sponsor', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.createUser({
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
      });

      expect(result).toEqual(mockUser);
      expect(User.create).toHaveBeenCalled();
    });

    it('should throw error for invalid sponsor code', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.createUser({
          email: 'test@example.com',
          passwordHash: 'hashedpassword',
          sponsorCode: 'INVALID',
        })
      ).rejects.toThrow('Sponsor code not found');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return null when not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await userService.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByReferralCode', () => {
    it('should return user by referral code', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findByReferralCode('TEST-ABC1');

      expect(result).toEqual(mockUser);
      expect(User.findOne).toHaveBeenCalledWith({ where: { referralCode: 'TEST-ABC1' } });
    });
  });

  describe('findById', () => {
    it('should return user with sponsor included', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(User.findByPk).toHaveBeenCalledWith('user-123', {
        include: [{ model: User, as: 'sponsor', attributes: ['id', 'referralCode', 'email'] }],
      });
    });

    it('should return null when not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await userService.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      const mockResult = { rows: [mockUser], count: 1 };
      (User.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await userService.getAllUsers({ limit: 20, offset: 0 });

      expect(result).toEqual(mockResult);
    });

    it('should filter by status', async () => {
      (User.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      await userService.getAllUsers({ status: 'active' });

      expect(User.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        })
      );
    });
  });

  describe('getDirectReferrals', () => {
    it('should return direct referrals', async () => {
      const referrals = [{ id: 'ref-1' }, { id: 'ref-2' }];
      (User.findAll as jest.Mock).mockResolvedValue(referrals);

      const result = await userService.getDirectReferrals('user-123');

      expect(result).toEqual(referrals);
      expect(User.findAll).toHaveBeenCalledWith({
        where: { sponsorId: 'user-123' },
        order: [['created_at', 'DESC']],
      });
    });
  });

  describe('countByPosition', () => {
    it('should count users by position', async () => {
      (User.count as jest.Mock).mockResolvedValue(5);

      const result = await userService.countByPosition('user-123', 'left');

      expect(result).toBe(5);
      expect(User.count).toHaveBeenCalledWith({
        where: { sponsorId: 'user-123', position: 'left' },
      });
    });
  });
});
