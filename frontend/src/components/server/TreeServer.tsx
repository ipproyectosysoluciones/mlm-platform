/**
 * @fileoverview Server-side Tree component
 * @description Data fetching component for binary tree visualization
 *              Componente de árbol que fetch data en el servidor/build
 * @module components/server/TreeServer
 */

import { treeService } from '../../services/api';
import type { TreeNode } from '../../types';

/**
 * Server component for fetching tree data
 * @param userId - User ID to fetch tree for
 * @param maxDepth - Optional maximum depth
 * @returns Promise resolving to tree node
 */
export async function fetchTreeData(userId: string, maxDepth?: number): Promise<TreeNode> {
  return treeService.getTree(userId, maxDepth);
}

/**
 * Fetch current user's tree
 * @param maxDepth - Optional maximum depth
 * @returns Promise resolving to tree node
 */
export async function fetchMyTree(maxDepth?: number): Promise<TreeNode> {
  return treeService.getMyTree(maxDepth);
}

/**
 * Prefetch tree data for streaming
 * @param userId - User ID to fetch tree for
 * @param maxDepth - Optional maximum depth
 * @returns Promise for tree data
 */
export function prefetchTreeData(userId: string, maxDepth?: number): Promise<TreeNode> {
  return treeService.getTree(userId, maxDepth);
}

/**
 * Prefetch current user's tree for streaming
 * @param maxDepth - Optional maximum depth
 * @returns Promise for tree data
 */
export function prefetchMyTree(maxDepth?: number): Promise<TreeNode> {
  return treeService.getMyTree(maxDepth);
}

/**
 * Calculate tree statistics from node data
 * @param node - Tree node to analyze
 * @returns Object with tree statistics
 */
export function calculateTreeStats(node: TreeNode): {
  totalNodes: number;
  maxDepth: number;
  leftCount: number;
  rightCount: number;
} {
  let totalNodes = 1;
  let maxDepth = node.level;

  function traverse(n: TreeNode): void {
    if (n.children) {
      for (const child of n.children) {
        totalNodes++;
        maxDepth = Math.max(maxDepth, child.level);
        traverse(child);
      }
    }
  }

  traverse(node);

  return {
    totalNodes,
    maxDepth: maxDepth - node.level,
    leftCount: node.stats.leftCount,
    rightCount: node.stats.rightCount,
  };
}
