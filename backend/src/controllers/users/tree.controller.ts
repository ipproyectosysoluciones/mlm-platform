/**
 * @fileoverview Tree Controller - Binary tree visualization endpoints
 * @description Handles user tree operations and visualization
 * @module controllers/users/tree
 */
import { Response } from 'express';
import { treeServiceInstance } from '../../services/UserService';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Get user binary tree
 * Supports pagination with query params ?depth=&page=&limit=
 */
export async function getTree(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.params.id || req.user!.id;
  const depth = req.query.depth ? parseInt(req.query.depth as string, 10) : undefined;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  // Si se pide paginación, usa getSubtreePaginated
  if (req.query.page || req.query.limit) {
    const result = await treeServiceInstance.getSubtreePaginated(userId, depth || 3, page, limit);

    if (!result.tree) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const stats = await treeServiceInstance.getLegCounts(userId);

    res.json({
      success: true,
      data: {
        tree: result.tree,
        pagination: result.pagination,
        stats,
      },
    });
    return;
  }

  // Comportamiento original para compatibilidad
  const tree = await treeServiceInstance.getUserTree(userId, depth);
  if (!tree) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const stats = await treeServiceInstance.getLegCounts(userId);

  res.json({
    success: true,
    data: { tree, stats },
  });
}

/**
 * Search users in subtree
 */
export async function searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { q } = req.query;
  const userId = req.user!.id;

  if (!q || typeof q !== 'string' || q.length < 2) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_QUERY', message: 'Query must be at least 2 characters' },
    });
    return;
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const results = await treeServiceInstance.searchInSubtree(userId, q, limit);

  res.json({
    success: true,
    data: results,
  });
}

/**
 * Get user details by ID
 */
export async function getUserDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const requesterId = req.user!.id;

  if (!id) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'User ID is required' },
    });
    return;
  }

  const details = await treeServiceInstance.getUserDetails(id, requesterId);

  if (!details) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found or not in your network' },
    });
    return;
  }

  res.json({
    success: true,
    data: details,
  });
}
