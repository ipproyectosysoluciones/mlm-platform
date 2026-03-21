/**
 * UserService - Gestión de usuarios y referencias
 * UserService - User and referral management
 */
import { User } from '../models';
import { generateUniqueReferralCode, generateUUID } from '../utils/codeGenerator';
import { TreeService } from './TreeService';
import { AppError } from '../middleware/error.middleware';

const treeService = new TreeService();

export class UserService {
  /**
   * Crea un nuevo usuario con código de referido único
   * Creates a new user with unique referral code
   *
   * Asigna automáticamente la posición izquierda/derecha usando TreeService.
   * Automatically assigns left/right position using TreeService.
   */
  async createUser(data: {
    email: string;
    passwordHash: string;
    sponsorCode?: string;
    currency?: 'USD' | 'COP' | 'MXN';
  }): Promise<User> {
    const referralCode = await generateUniqueReferralCode();

    let sponsorId: string | null = null;
    let position: 'left' | 'right' | null = null;

    if (data.sponsorCode) {
      const sponsor = await User.findOne({
        where: { referralCode: data.sponsorCode },
      });

      if (!sponsor) {
        throw new AppError(400, 'INVALID_REFERRAL_CODE', 'Sponsor code not found');
      }

      sponsorId = sponsor.id;
      position = await treeService.findAvailablePosition(sponsorId);
    }

    const userId = generateUUID();

    const user = await User.create({
      id: userId,
      email: data.email,
      passwordHash: data.passwordHash,
      referralCode,
      sponsorId,
      position,
      level: 1,
      status: 'active',
      role: 'user',
      currency: data.currency || 'USD',
    });

    await treeService.insertWithClosure(userId, sponsorId);

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  async findByReferralCode(code: string): Promise<User | null> {
    return User.findOne({ where: { referralCode: code } });
  }

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id, {
      include: [{ model: User, as: 'sponsor', attributes: ['id', 'referralCode', 'email'] }],
    });
  }

  async getAllUsers(options?: {
    limit?: number;
    offset?: number;
    status?: 'active' | 'inactive';
  }): Promise<{ rows: User[]; count: number }> {
    const where: Record<string, unknown> = {};
    if (options?.status) where.status = options.status;

    return User.findAndCountAll({
      where,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      order: [['created_at', 'DESC']],
    });
  }

  async getDirectReferrals(userId: string): Promise<User[]> {
    return User.findAll({
      where: { sponsorId: userId },
      order: [['created_at', 'DESC']],
    });
  }

  async countByPosition(sponsorId: string, position: 'left' | 'right'): Promise<number> {
    return User.count({
      where: { sponsorId, position },
    });
  }

  async updateUser(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string }
  ): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;

    if (data.firstName !== undefined) (user as any).firstName = data.firstName;
    if (data.lastName !== undefined) (user as any).lastName = data.lastName;
    if (data.phone !== undefined) (user as any).phone = data.phone;

    await user.save();
    return user;
  }

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;

    (user as any).passwordHash = passwordHash;
    await user.save();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await User.findByPk(id);
    if (!user) return false;

    await user.destroy();
    return true;
  }
}

export const userService = new UserService();
export const treeServiceInstance = treeService;
