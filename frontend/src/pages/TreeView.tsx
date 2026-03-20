/**
 * TreeView - Visualización del árbol binario MLM
 * TreeView - MLM binary tree visualization
 *
 * Renderiza recursivamente el árbol con controles de profundidad.
 * Recursively renders the tree with depth controls.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { treeService } from '../services/api';
import type { TreeNode } from '../types';

export default function TreeView() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [depth, setDepth] = useState(3);

  useEffect(() => {
    const loadTree = async () => {
      try {
        const treeData = await treeService.getMyTree(depth);
        setTree(treeData);
      } catch (error) {
        console.error('Failed to load tree:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTree();
  }, [depth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Failed to load tree</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <h1 className="text-xl font-bold text-indigo-600">Binary Tree</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDepth(Math.max(1, depth - 1))}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={depth <= 1}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Depth: {depth}</span>
            <button
              onClick={() => setDepth(Math.min(10, depth + 1))}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={depth >= 10}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
          <TreeNodeComponent node={tree} level={0} maxDepth={depth} />
        </div>
      </main>
    </div>
  );
}

/**
 * TreeNodeComponent - Renderiza un nodo individual del árbol
 * TreeNodeComponent - Renders an individual tree node
 */
function TreeNodeComponent({
  node,
  level,
  maxDepth,
}: {
  node: TreeNode;
  level: number;
  maxDepth: number;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isMaxDepth = level >= maxDepth - 1;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`px-4 py-3 rounded-lg border-2 ${
          node.position === 'left' ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'
        } min-w-[150px] text-center`}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Users className="w-4 h-4" />
          <span className="font-semibold text-sm">{node.email?.split('@')[0] || 'User'}</span>
        </div>
        <p className="text-xs text-gray-500">Level {node.level}</p>
        <p className="text-xs text-gray-500 capitalize">{node.position} leg</p>
        <div className="flex justify-center gap-2 mt-2 text-xs">
          <span className="bg-blue-200 px-2 py-0.5 rounded">L: {node.stats?.leftCount ?? 0}</span>
          <span className="bg-purple-200 px-2 py-0.5 rounded">
            R: {node.stats?.rightCount ?? 0}
          </span>
        </div>
      </div>

      {hasChildren && !isMaxDepth && (
        <div className="flex gap-8 mt-4">
          {node.children.map((child) => (
            <TreeNodeComponent key={child.id} node={child} level={level + 1} maxDepth={maxDepth} />
          ))}
        </div>
      )}

      {hasChildren && isMaxDepth && (
        <div className="mt-2 text-sm text-gray-500">+{node.children.length} more members</div>
      )}

      {!hasChildren && level < maxDepth - 1 && (
        <div className="mt-4 text-sm text-gray-400 italic">No downline</div>
      )}
    </div>
  );
}
