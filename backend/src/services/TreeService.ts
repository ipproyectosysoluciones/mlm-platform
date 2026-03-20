/**
 * TreeService - Maneja operaciones del árbol genealógico/MLM
 * TreeService - Handles genealogical/MLM tree operations
 *
 * Utiliza el patrón Closure Table para representar la jerarquía del árbol binario.
 * Uses the Closure Table pattern to represent the binary tree hierarchy.
 *
 * @example
 * const tree = await treeService.getUserTree(userId, 3);
 * const upline = await treeService.getUpline(userId);
 */
import { sequelize } from '../config/database';
import { User, UserClosure } from '../models';
import type { TreeNode } from '../types';

export class TreeService {
  /**
   * Busca la posición disponible para un nuevo usuario bajo un patrocinador
   * Finds the available position for a new user under a sponsor
   *
   * Balancea el árbol colocando usuarios donde hay menos.
   * Balances the tree by placing users where there are fewer.
   *
   * @param sponsorId - ID del usuario patrocinador / Sponsor user ID
   * @returns 'left' o 'right' / 'left' or 'right'
   */
  async findAvailablePosition(sponsorId: string): Promise<'left' | 'right'> {
    const leftCount = await User.count({
      where: { sponsorId, position: 'left' },
    });
    const rightCount = await User.count({
      where: { sponsorId, position: 'right' },
    });

    return leftCount <= rightCount ? 'left' : 'right';
  }

  /**
   * Inserta un usuario en la tabla de cierre con sus ancestros
   * Inserts a user into the closure table with their ancestors
   *
   * Crea un registro donde el usuario es su propio ancestro (depth=0)
   * y copia todos los ancestros del patrocinador.
   * Creates a record where the user is their own ancestor (depth=0)
   * and copies all sponsor ancestors.
   *
   * @param userId - ID del nuevo usuario / New user ID
   * @param sponsorId - ID del patrocinador o null / Sponsor ID or null
   */
  async insertWithClosure(userId: string, sponsorId: string | null): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      await UserClosure.create(
        {
          ancestorId: userId,
          descendantId: userId,
          depth: 0,
        },
        { transaction }
      );

      if (sponsorId) {
        const [results] = await sequelize.query(
          `SELECT ancestor_id, depth + 1 as depth
           FROM user_closure
           WHERE descendant_id = :sponsorId`,
          {
            replacements: { sponsorId },
            transaction,
            type: 'SELECT',
          }
        );

        const ancestors = results as Array<{ ancestor_id: string; depth: number }>;

        if (ancestors.length > 0) {
          const closureRecords = ancestors.map((a) => ({
            ancestorId: a.ancestor_id,
            descendantId: userId,
            depth: a.depth,
          }));

          await UserClosure.bulkCreate(closureRecords, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Obtiene el árbol de un usuario hasta cierta profundidad
   * Gets the tree of a user up to a certain depth
   *
   * Incluye conteos de hijos izquierda/derecha para cada nodo.
   * Includes left/right child counts for each node.
   *
   * @param userId - ID del usuario raíz / Root user ID
   * @param maxDepth - Profundidad máxima (opcional) / Maximum depth (optional)
   * @returns TreeNode con hijos o null si no existe / TreeNode with children or null if not found
   */
  async getUserTree(userId: string, maxDepth?: number): Promise<TreeNode | null> {
    const user = await User.findByPk(userId);
    if (!user) return null;

    const leftCount = await User.count({
      where: { sponsorId: userId, position: 'left' },
    });
    const rightCount = await User.count({
      where: { sponsorId: userId, position: 'right' },
    });

    const root: TreeNode = {
      id: user.id,
      email: user.email,
      referralCode: user.referralCode,
      position: user.position || 'left',
      level: user.level,
      stats: {
        leftCount,
        rightCount,
      },
      children: [],
    };

    if (maxDepth && maxDepth <= 1) return root;

    const children = await this.getChildren(userId, maxDepth ? maxDepth - 1 : undefined);
    root.children = children;

    return root;
  }

  /**
   * Obtiene hijos recursivamente hasta maxDepth
   * Gets children recursively up to maxDepth
   *
   * @param userId - ID del padre / Parent ID
   * @param maxDepth - Profundidad restante / Remaining depth
   */
  private async getChildren(userId: string, maxDepth?: number): Promise<TreeNode[]> {
    const children = await User.findAll({
      where: { sponsorId: userId },
    });

    const treeNodes: TreeNode[] = [];

    for (const child of children) {
      const leftCount = await User.count({
        where: { sponsorId: child.id, position: 'left' },
      });
      const rightCount = await User.count({
        where: { sponsorId: child.id, position: 'right' },
      });

      const node: TreeNode = {
        id: child.id,
        email: child.email,
        referralCode: child.referralCode,
        position: child.position || 'left',
        level: child.level,
        stats: {
          leftCount,
          rightCount,
        },
        children: [],
      };

      if (maxDepth && maxDepth > 1) {
        node.children = await this.getChildren(child.id, maxDepth - 1);
      } else if (!maxDepth) {
        node.children = await this.getChildren(child.id);
      }

      treeNodes.push(node);
    }

    return treeNodes;
  }

  /**
   * Obtiene la línea ascendente (patrocinadores) de un usuario
   * Gets the upline (sponsors) of a user
   *
   * Ordenado por profundidad ascendente (patrocinador directo primero).
   * Ordered by ascending depth (direct sponsor first).
   *
   * @param userId - ID del usuario / User ID
   * @returns Array de usuarios ancestros / Array of ancestor users
   */
  async getUpline(userId: string): Promise<User[]> {
    const ancestors = await sequelize.query(
      `SELECT u.*, uc.depth
       FROM user_closure uc
       JOIN users u ON uc.ancestor_id = u.id
       WHERE uc.descendant_id = :userId
         AND uc.depth > 0
       ORDER BY uc.depth ASC`,
      {
        replacements: { userId },
        model: User,
        mapToModel: true,
      }
    );

    return ancestors;
  }

  /**
   * Obtiene conteos y volúmenes de las piernas izquierda/derecha
   * Gets counts and volumes of left/right legs
   *
   * El volumen se calcula como count * 100 (valor fijo por usuario).
   * Volume is calculated as count * 100 (fixed value per user).
   *
   * @param userId - ID del usuario / User ID
   */
  async getLegCounts(userId: string): Promise<{
    leftCount: number;
    rightCount: number;
    leftVolume: number;
    rightVolume: number;
  }> {
    const leftCount = await this.getDescendantCount(userId, 'left');
    const rightCount = await this.getDescendantCount(userId, 'right');

    return {
      leftCount,
      rightCount,
      leftVolume: leftCount * 100,
      rightVolume: rightCount * 100,
    };
  }

  private async getDescendantCount(userId: string, position: 'left' | 'right'): Promise<number> {
    const result = await sequelize.query(
      `SELECT COUNT(*) as count
       FROM user_closure uc
       JOIN users u ON uc.descendant_id = u.id
       WHERE uc.ancestor_id = :userId
         AND uc.depth > 0
         AND u.position = :position`,
      {
        replacements: { userId, position },
        type: 'SELECT',
      }
    );

    const firstResult = result[0] as unknown as { count: number };
    return firstResult?.count || 0;
  }
}
