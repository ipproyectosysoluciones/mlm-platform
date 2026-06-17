/**
 * @fileoverview AdminUsersController Unit Tests
 * @description Tests for admin user management handlers
 * @module __tests__/unit/AdminUsersController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../models', () => ({
  User: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  Commission: {
    sum: jest.fn(),
  },
}));

jest.mock('../../models/Lead', () => ({
  Lead: {
    update: jest.fn(),
  },
}));

const mockGetLegCounts = jest.fn();
jest.mock('../../services/TreeService', () => ({
  TreeService: jest.fn().mockImplementation(() => ({
    getLegCounts: mockGetLegCounts,
  })),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  promoteToAdmin,
  updateUserRole,
} from '../../controllers/admin/UsersAdminController';
import { User, Commission } from '../../models';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: 'admin-uuid', email: 'admin@test.com', role: 'admin', referralCode: 'ADM-001' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UsersAdminController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getAllUsers ───────────────────────────────────────────────────────────

  describe('getAllUsers', () => {
    it('returns paginated user list with default pagination', async () => {
      const mockUsers = [
        {
          id: 'u1',
          email: 'a@test.com',
          level: 1,
          status: 'active',
          role: 'user',
          position: 'left',
          referralCode: 'R1',
          createdAt: new Date(),
        },
      ];
      (User.findAndCountAll as jest.Mock).mockResolvedValue({ rows: mockUsers, count: 1 });

      const req = createMockReq({ query: {} });
      const res = createMockRes();

      await getAllUsers(req, res);

      expect(User.findAndCountAll).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            users: expect.arrayContaining([expect.objectContaining({ id: 'u1' })]),
            pagination: expect.objectContaining({ page: 1, limit: 20, total: 1 }),
          }),
        })
      );
    });

    it('filters by status when provided', async () => {
      (User.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      const req = createMockReq({ query: { status: 'inactive' } });
      const res = createMockRes();

      await getAllUsers(req, res);

      const callArgs = (User.findAndCountAll as jest.Mock).mock.calls[0][0];
      expect(callArgs.where).toMatchObject({ status: 'inactive' });
    });

    it('does not filter by status when value is invalid', async () => {
      (User.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      const req = createMockReq({ query: { status: 'banned' } });
      const res = createMockRes();

      await getAllUsers(req, res);

      const callArgs = (User.findAndCountAll as jest.Mock).mock.calls[0][0];
      expect(callArgs.where).not.toHaveProperty('status');
    });

    it('returns 500 on DB error', async () => {
      (User.findAndCountAll as jest.Mock).mockRejectedValue(new Error('DB failure'));

      const req = createMockReq({ query: {} });
      const res = createMockRes();

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getUserById ───────────────────────────────────────────────────────────

  describe('getUserById', () => {
    it('returns 404 when user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = createMockReq({ params: { userId: 'nonexistent-uuid' } });
      const res = createMockRes();

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns user details with stats when found', async () => {
      const mockUser = {
        id: 'u1',
        email: 'a@test.com',
        level: 2,
        status: 'active',
        role: 'user',
        position: 'left',
        referralCode: 'R1',
        sponsorId: 'sp1',
        currency: 'USD',
        createdAt: new Date(),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.count as jest.Mock).mockResolvedValue(3);
      (Commission.sum as jest.Mock).mockResolvedValue(500);

      // mockGetLegCounts is the shared mock fn used by the module-level treeService instance
      mockGetLegCounts.mockResolvedValue({ leftCount: 2, rightCount: 1 });

      const req = createMockReq({ params: { userId: 'u1' } });
      const res = createMockRes();

      await getUserById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({ id: 'u1' }),
            stats: expect.objectContaining({ directReferrals: 3 }),
          }),
        })
      );
    });
  });

  // ── updateUserStatus ──────────────────────────────────────────────────────

  describe('updateUserStatus', () => {
    it('returns 400 for invalid status value', async () => {
      const req = createMockReq({ params: { userId: 'u1' }, body: { status: 'suspended' } });
      const res = createMockRes();

      await updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = createMockReq({ params: { userId: 'u1' }, body: { status: 'inactive' } });
      const res = createMockRes();

      await updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updates status and returns success', async () => {
      const mockUser = {
        id: 'u1',
        status: 'active',
        update: jest.fn().mockResolvedValue(undefined),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockReq({ params: { userId: 'u1' }, body: { status: 'inactive' } });
      const res = createMockRes();

      await updateUserStatus(req, res);

      expect(mockUser.update).toHaveBeenCalledWith({ status: 'inactive' });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // ── promoteToAdmin ────────────────────────────────────────────────────────

  describe('promoteToAdmin', () => {
    it('returns 400 when trying to promote yourself', async () => {
      const req = createMockReq({ params: { userId: 'admin-uuid' } }); // same as req.user.id
      const res = createMockRes();

      await promoteToAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = createMockReq({ params: { userId: 'other-uuid' } });
      const res = createMockRes();

      await promoteToAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('promotes user to admin on success', async () => {
      const mockUser = {
        id: 'other-uuid',
        role: 'user',
        update: jest.fn().mockResolvedValue(undefined),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockReq({ params: { userId: 'other-uuid' } });
      const res = createMockRes();

      await promoteToAdmin(req, res);

      expect(mockUser.update).toHaveBeenCalledWith({ role: 'admin' });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // ── updateUserRole ────────────────────────────────────────────────────────

  describe('updateUserRole', () => {
    it('returns 400 for invalid/non-assignable role', async () => {
      const req = createMockReq({
        params: { userId: 'other-uuid' },
        body: { role: 'super_admin' }, // not assignable via API
      });
      const res = createMockRes();

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when trying to change own role', async () => {
      const req = createMockReq({
        params: { userId: 'admin-uuid' }, // same as req.user.id
        body: { role: 'user' },
      });
      const res = createMockRes();

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = createMockReq({ params: { userId: 'other-uuid' }, body: { role: 'user' } });
      const res = createMockRes();

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when trying to change role of a super_admin', async () => {
      const mockUser = { id: 'other-uuid', role: 'super_admin', update: jest.fn() };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockReq({ params: { userId: 'other-uuid' }, body: { role: 'admin' } });
      const res = createMockRes();

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('updates role successfully', async () => {
      const mockUser = {
        id: 'other-uuid',
        role: 'user',
        update: jest.fn().mockResolvedValue(undefined),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockReq({ params: { userId: 'other-uuid' }, body: { role: 'vendor' } });
      const res = createMockRes();

      await updateUserRole(req, res);

      expect(mockUser.update).toHaveBeenCalledWith({ role: 'vendor' });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
