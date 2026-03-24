/**
 * @fileoverview UserService - User and referral management
 * @description Handles user creation, authentication, profile management, and referral tracking.
 *             Gestión de usuarios, autenticación, perfiles y seguimiento de referidos.
 * @module services/UserService
 * @author MLM Development Team
 */

import { User } from '../models';
import { generateUniqueReferralCode, generateUUID } from '../utils/codeGenerator';
import { TreeService } from './TreeService';
import { AppError } from '../middleware/error.middleware';

const treeService = new TreeService();

/**
 * User Service - Manages user operations and referrals
 * Servicio de Usuarios - Gestiona operaciones de usuarios y referidos
 */
export class UserService {
  /**
   * Create a new user with unique referral code
   * Crea un nuevo usuario con código de referido único
   *
   * Generates a unique referral code, validates sponsor if provided,
   * and assigns left/right position automatically using TreeService.
   *
   * @param {Object} data - User creation data / Datos de creación de usuario
   * @param {string} data.email - User email address / Correo electrónico del usuario
   * @param {string} data.passwordHash - Bcrypt hashed password / Hash bcrypt de contraseña
   * @param {string} [data.sponsorCode] - Sponsor referral code (optional) / Código de referido del patrocinador
   * @param {string} [data.currency] - Preferred currency (USD, COP, MXN) / Moneda preferida
   * @returns {Promise<User>} Created user instance / Instancia del usuario creado
   * @throws {AppError} 400 if sponsor code is invalid / Si el código de patrocinador es inválido
   * @example
   * // English: Create a new user
   * const user = await userService.createUser({
   *   email: 'newuser@example.com',
   *   passwordHash: '$2b$12$hash...',
   *   sponsorCode: 'MLM-XXXX-XXXX',
   *   currency: 'USD'
   * });
   *
   * // Español: Crear un nuevo usuario
   * const user = await userService.createUser({
   *   email: 'nuevousuario@ejemplo.com',
   *   passwordHash: '$2b$12$hash...',
   *   sponsorCode: 'MLM-XXXX-XXXX',
   *   currency: 'USD'
   * });
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

  /**
   * Find user by email address
   * Buscar usuario por correo electrónico
   * @param {string} email - User email / Correo electrónico del usuario
   * @returns {Promise<User | null>} User instance or null / Instancia de usuario o null
   * @example
   * // English: Find user by email
   * const user = await userService.findByEmail('user@example.com');
   *
   * // Español: Buscar usuario por email
   * const user = await userService.findByEmail('usuario@ejemplo.com');
   */
  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  /**
   * Find user by referral code
   * Buscar usuario por código de referido
   * @param {string} code - Unique referral code / Código de referido único
   * @returns {Promise<User | null>} User instance or null / Instancia de usuario o null
   * @example
   * // English: Find sponsor by referral code
   * const sponsor = await userService.findByReferralCode('MLM-ABCD-1234');
   *
   * // Español: Buscar patrocinador por código de referido
   * const sponsor = await userService.findByReferralCode('MLM-ABCD-1234');
   */
  async findByReferralCode(code: string): Promise<User | null> {
    return User.findOne({ where: { referralCode: code } });
  }

  /**
   * Find user by ID with sponsor information
   * Buscar usuario por ID con información del patrocinador
   * @param {string} id - User UUID / UUID del usuario
   * @returns {Promise<User | null>} User instance with sponsor or null / Usuario con patrocinador o null
   * @example
   * // English: Get user with sponsor details
   * const user = await userService.findById('uuid-here');
   * if (user?.sponsor) {
   *   console.log('Sponsor:', user.sponsor.email);
   * }
   *
   * // Español: Obtener usuario con detalles del patrocinador
   * const user = await userService.findById('uuid-aqui');
   * if (user?.sponsor) {
   *   console.log('Patrocinador:', user.sponsor.email);
   * }
   */
  async findById(id: string): Promise<User | null> {
    return User.findByPk(id, {
      include: [{ model: User, as: 'sponsor', attributes: ['id', 'referralCode', 'email'] }],
    });
  }

  /**
   * Get all users with pagination and optional status filter
   * Obtener todos los usuarios con paginación y filtro opcional de estado
   * @param {Object} [options] - Pagination options / Opciones de paginación
   * @param {number} [options.limit] - Maximum results to return / Máximo de resultados a devolver
   * @param {number} [options.offset] - Number of results to skip / Número de resultados a omitir
   * @param {string} [options.status] - Filter by status (active/inactive) / Filtrar por estado
   * @returns {Promise<{rows: User[], count: number}>} Paginated users with total count / Usuarios paginados con total
   * @example
   * // English: Get first page of active users
   * const { rows, count } = await userService.getAllUsers({ limit: 20, offset: 0, status: 'active' });
   *
   * // Español: Obtener primera página de usuarios activos
   * const { rows, count } = await userService.getAllUsers({ limit: 20, offset: 0, status: 'active' });
   */
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

  /**
   * Get direct referrals of a user
   * Obtener referidos directos de un usuario
   * @param {string} userId - User ID / ID del usuario
   * @returns {Promise<User[]>} Array of direct referrals / Arreglo de referidos directos
   * @example
   * // English: Get user's direct referrals
   * const referrals = await userService.getDirectReferrals('user-uuid');
   *
   * // Español: Obtener referidos directos del usuario
   * const referrals = await userService.getDirectReferrals('uuid-usuario');
   */
  async getDirectReferrals(userId: string): Promise<User[]> {
    return User.findAll({
      where: { sponsorId: userId },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Count users in a specific position under a sponsor
   * Contar usuarios en una posición específica bajo un patrocinador
   * @param {string} sponsorId - Sponsor user ID / ID del usuario patrocinador
   * @param {'left' | 'right'} position - Tree position / Posición en el árbol
   * @returns {Promise<number>} Count of users / Cantidad de usuarios
   * @example
   * // English: Count users in left leg
   * const leftCount = await userService.countByPosition(sponsorId, 'left');
   *
   * // Español: Contar usuarios en pierna izquierda
   * const izquierdaCount = await userService.countByPosition(sponsorId, 'izquierda');
   */
  async countByPosition(sponsorId: string, position: 'left' | 'right'): Promise<number> {
    return User.count({
      where: { sponsorId, position },
    });
  }

  /**
   * Update user profile information
   * Actualizar información del perfil de usuario
   * @param {string} id - User ID / ID del usuario
   * @param {Object} data - Profile data to update / Datos de perfil a actualizar
   * @param {string} [data.firstName] - First name / Nombre
   * @param {string} [data.lastName] - Last name / Apellido
   * @param {string} [data.phone] - Phone number / Número de teléfono
   * @returns {Promise<User | null>} Updated user or null if not found / Usuario actualizado o null
   * @example
   * // English: Update user profile
   * const user = await userService.updateUser('uuid', { firstName: 'John', lastName: 'Doe' });
   *
   * // Español: Actualizar perfil de usuario
   * const user = await userService.updateUser('uuid', { firstName: 'Juan', lastName: 'Pérez' });
   */
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

  /**
   * Update user password
   * Actualizar contraseña de usuario
   * @param {string} id - User ID / ID del usuario
   * @param {string} passwordHash - New bcrypt hashed password / Nuevo hash bcrypt de contraseña
   * @returns {Promise<User | null>} Updated user or null if not found / Usuario actualizado o null
   * @example
   * // English: Update user password
   * const user = await userService.updatePassword('uuid', '$2b$12$newHash...');
   *
   * // Español: Actualizar contraseña del usuario
   * const user = await userService.updatePassword('uuid', '$2b$12$nuevoHash...');
   */
  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;

    (user as any).passwordHash = passwordHash;
    await user.save();
    return user;
  }

  /**
   * Delete a user (soft delete via model destroy)
   * Eliminar un usuario (soft delete vía destroy del modelo)
   * @param {string} id - User ID to delete / ID del usuario a eliminar
   * @returns {Promise<boolean>} True if deleted, false if not found / True si se eliminó, false si no existe
   * @example
   * // English: Delete a user
   * const deleted = await userService.deleteUser('uuid');
   * if (deleted) {
   *   console.log('User deleted successfully');
   * }
   *
   * // Español: Eliminar un usuario
   * const eliminado = await userService.deleteUser('uuid');
   * if (eliminado) {
   *   console.log('Usuario eliminado exitosamente');
   * }
   */
  async deleteUser(id: string): Promise<boolean> {
    const user = await User.findByPk(id);
    if (!user) return false;

    await user.destroy();
    return true;
  }
}

export const userService = new UserService();
export const treeServiceInstance = treeService;
