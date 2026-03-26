/**
 * @fileoverview TreeService - Binary tree operations using Closure Table pattern
 * @description Manages the MLM binary tree hierarchy including user placement,
 *              tree traversal, upline/downline queries, and subtree operations.
 *              Gestiona la jerarquía del árbol binario MLM incluyendo colocación
 *              de usuarios, recorrido del árbol, consultas de upline/downline y operaciones de subárbol.
 * @module services/TreeService
 * @author MLM Development Team
 *
 * @example
 * // English: Get user tree up to 3 levels deep
 * const tree = await treeService.getUserTree(userId, 3);
 *
 * // English: Get user's sponsor chain
 * const upline = await treeService.getUpline(userId);
 *
 * // Español: Obtener árbol de usuario hasta 3 niveles de profundidad
 * const tree = await treeService.getUserTree(userId, 3);
 *
 * // Español: Obtener cadena de patrocinadores del usuario
 * const upline = await treeService.getUpline(userId);
 */
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { User, UserClosure } from '../models';
import type { TreeNode, UserAttributes } from '../types';

// Types for Phase 3
interface UserSearchResult {
  id: string;
  email: string;
  referralCode: string;
  level: number;
}

interface UserDetailsResult {
  id: string;
  email: string;
  referralCode: string;
  position: 'left' | 'right';
  level: number;
  status: 'active' | 'inactive';
  stats: {
    leftCount: number;
    rightCount: number;
    totalDownline: number;
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

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

        // Sequelize with MySQL returns a single object when there's one result,
        // not an array. Normalize to always be an array.
        // Sequelize con MySQL retorna un objeto cuando hay un solo resultado,
        // no un array. Normalizar a siempre ser un array.
        const rawAncestors = results as unknown;

        // Handle the case where results might be empty, a single object, or an array
        let ancestors: Array<{ ancestor_id: string; depth: number }> = [];
        if (rawAncestors) {
          if (Array.isArray(rawAncestors)) {
            ancestors = rawAncestors as Array<{ ancestor_id: string; depth: number }>;
          } else {
            // Single object result
            ancestors = [rawAncestors as { ancestor_id: string; depth: number }];
          }
        }

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
   * OPTIMIZADO: Usa batch queries para evitar N+1
   * OPTIMIZED: Uses batch queries to avoid N+1
   *
   * @param userId - ID del padre / Parent ID
   * @param maxDepth - Profundidad restante / Remaining depth
   */
  private async getChildren(userId: string, maxDepth?: number): Promise<TreeNode[]> {
    const children = await User.findAll({
      where: { sponsorId: userId },
    });

    if (children.length === 0) return [];

    // Batch query para evitar N+1 — obtiene todos los conteos de una vez
    // Batch query to avoid N+1 — gets all counts at once
    const childIds = children.map((c) => c.id);
    const counts = await User.findAll({
      attributes: ['sponsorId', 'position', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: { sponsorId: childIds },
      group: ['sponsorId', 'position'],
      raw: true,
    });

    // Map counts by sponsorId + position para acceso O(1)
    // Map counts by sponsorId + position for O(1) access
    const countMap = new Map<string, number>();
    (counts as unknown as Array<{ sponsorId: string; position: string; count: number }>).forEach(
      (c) => countMap.set(`${c.sponsorId}-${c.position}`, c.count)
    );

    const treeNodes: TreeNode[] = [];

    for (const child of children) {
      const leftCount = countMap.get(`${child.id}-left`) || 0;
      const rightCount = countMap.get(`${child.id}-right`) || 0;

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
    const [rawResult] = await sequelize.query(
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

    // Sequelize with MySQL returns single object when there's one result, not array
    const countObj = Array.isArray(rawResult) ? rawResult[0] : rawResult;
    return (countObj as { count: number })?.count || 0;
  }

  // ============================================================
  // PHASE 3: NEW METHODS FOR VISUAL TREE UI
  // ============================================================

  /**
   * Obtiene el subtree paginado con metadata
   * Gets paginated subtree with metadata
   *
   * @param userId - ID del usuario raíz / Root user ID
   * @param depth - Profundidad máxima / Maximum depth
   * @param page - Número de página / Page number
   * @param limit - Límite de nodos por página / Nodes per page limit
   */
  async getSubtreePaginated(
    userId: string,
    depth: number,
    page: number = 1,
    limit: number = 50
  ): Promise<{ tree: TreeNode | null; pagination: PaginationMeta }> {
    const tree = await this.getUserTree(userId, depth);

    if (!tree) {
      return {
        tree: null,
        pagination: { total: 0, page, limit, hasMore: false },
      };
    }

    // Cuenta nodos totales recursivamente
    // Counts total nodes recursively
    const countNodes = (node: TreeNode): number => {
      return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
    };
    const total = countNodes(tree);

    return {
      tree,
      pagination: {
        total,
        page,
        limit,
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Busca usuarios en el subtree de un sponsor
   * Searches users in sponsor's subtree
   *
   * Busca por email o referral code en los downlines del usuario.
   * Searches by email or referral code in user's downlines.
   *
   * @param sponsorId - ID del sponsor / Sponsor ID
   * @param query - Término de búsqueda / Search term
   * @param limit - Límite de resultados / Results limit
   */
  async searchInSubtree(
    sponsorId: string,
    query: string,
    limit: number = 20
  ): Promise<UserSearchResult[]> {
    // Obtiene todos los descendant IDs del sponsor usando closure table
    // Gets all descendant IDs from sponsor using closure table
    const [rawResults] = await sequelize.query(
      `SELECT descendant_id 
       FROM user_closure 
       WHERE ancestor_id = :sponsorId AND depth > 0`,
      {
        replacements: { sponsorId },
        type: 'SELECT',
      }
    );

    // Handle null/undefined/empty results
    if (!rawResults) return [];

    // Sequelize with MySQL returns single object when there's one result, not array
    const descendants = (Array.isArray(rawResults) ? rawResults : [rawResults]) as Array<{
      descendant_id: string;
    }>;

    if (descendants.length === 0) return [];

    const descendantIds = descendants.map((d) => d.descendant_id);

    // Busca en los descendientes (case-insensitive para MySQL)
    // Searches in descendants (case-insensitive for MySQL)
    const users = await User.findAll({
      where: {
        id: { [Op.in]: descendantIds },
        [Op.or]: [
          // Use LIKE which is case-insensitive in MySQL by default
          { email: { [Op.like]: `%${query}%` } },
          { referralCode: { [Op.like]: `%${query}%` } },
        ],
      },
      attributes: ['id', 'email', 'referralCode', 'level'],
      limit,
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      referralCode: u.referralCode,
      level: u.level,
    }));
  }

  /**
   * Obtiene detalles extendidos de un usuario
   * Gets extended details of a user
   *
   * Verifica que el usuario solicitante sea ancestro del usuario consultado.
   * Verifies requester is ancestor of requested user.
   *
   * @param userId - ID del usuario a consultar / User ID to query
   * @param requesterId - ID del usuario solicitante / Requester user ID
   */
  async getUserDetails(userId: string, requesterId: string): Promise<UserDetailsResult | null> {
    // Verifica relación ancestro-descendiente
    // Verifies ancestor-descendant relationship
    const isDescendant = await sequelize.query(
      `SELECT 1 FROM user_closure 
       WHERE ancestor_id = :requesterId 
         AND descendant_id = :userId 
         AND depth > 0`,
      {
        replacements: { requesterId, userId },
        type: 'SELECT',
        plain: true,
      }
    );

    // También permite que el usuario vea sus propios detalles
    // Also allows user to view their own details
    if (!isDescendant && requesterId !== userId) {
      return null;
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'referralCode', 'position', 'level', 'status'],
    });

    if (!user) return null;

    // Obtiene stats del árbol
    // Gets tree stats
    const legCounts = await this.getLegCounts(userId);

    return {
      id: user.id,
      email: user.email,
      referralCode: user.referralCode,
      position: user.position as 'left' | 'right',
      level: user.level,
      status: user.status as 'active' | 'inactive',
      stats: {
        leftCount: legCounts.leftCount,
        rightCount: legCounts.rightCount,
        totalDownline: legCounts.leftCount + legCounts.rightCount,
      },
    };
  }
}
