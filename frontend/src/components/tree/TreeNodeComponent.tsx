/**
 * TreeNodeComponent - Nodo personalizado para React Flow
 * TreeNodeComponent - Custom node for React Flow
 *
 * Muestra información del usuario con avatar, stats y colores por pierna.
 * Shows user info with avatar, stats, and colors by leg (left/right).
 *
 * Phase 3: Componente core para la visualización del árbol.
 * Phase 3: Core component for tree visualization.
 *
 * @module components/tree/TreeNodeComponent
 */
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Users } from 'lucide-react';
import type { TreeNode } from '../../types';

// Type for the node data passed from React Flow
interface TreeNodeData {
  label: TreeNode;
}

interface TreeNodeComponentProps {
  data: TreeNodeData;
  selected?: boolean;
}

function TreeNodeComponent({ data, selected }: TreeNodeComponentProps) {
  const node = data.label;
  const isLeft = node.position === 'left';
  const isSelected = selected;
  const hasChildren = node.children && node.children.length > 0;

  // Generate avatar initial from email
  const initial = node.email?.[0]?.toUpperCase() || 'U';

  // Color classes based on position
  const positionClasses = isLeft
    ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
    : 'border-purple-500 bg-purple-50 hover:bg-purple-100';

  const statsBgLeft = isLeft ? 'bg-blue-200' : 'bg-purple-200';
  const statsBgRight = isLeft ? 'bg-blue-100' : 'bg-purple-100';

  return (
    <div className="relative">
      {/* Node content */}
      <div
        className={`
          px-4 py-3 rounded-lg border-2 min-w-[160px] cursor-pointer
          transition-all duration-200 shadow-sm
          ${positionClasses}
          ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 shadow-md' : ''}
        `}
      >
        {/* User avatar and info */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              font-bold text-lg text-white shadow-sm
              ${isLeft ? 'bg-blue-500' : 'bg-purple-500'}
            `}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" title={node.email}>
              {node.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {isLeft ? 'Left' : 'Right'} • Lvl {node.level}
            </p>
          </div>
          <Users className={`w-4 h-4 ${isLeft ? 'text-blue-500' : 'text-purple-500'}`} />
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded ${statsBgLeft} ${isLeft ? 'text-blue-700' : 'text-purple-700'}`}
          >
            L: {node.stats?.leftCount ?? 0}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded ${statsBgRight} ${isLeft ? 'text-blue-600' : 'text-purple-600'}`}
          >
            R: {node.stats?.rightCount ?? 0}
          </span>
        </div>
      </div>

      {/* Input handle (from parent) - positioned absolute */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white !-top-1.5"
        style={{ transform: 'translateX(-50%)' }}
      />

      {/* Output handles (to children) - only show if has children */}
      {hasChildren && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="left"
            className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white !-bottom-1.5"
            style={{ left: '30%', transform: 'translateX(-50%)' }}
          />
          {node.children.length > 1 && (
            <Handle
              type="source"
              position={Position.Bottom}
              id="right"
              className="!bg-purple-500 !w-3 !h-3 !border-2 !border-white !-bottom-1.5"
              style={{ left: '70%', transform: 'translateX(-50%)' }}
            />
          )}
        </>
      )}
    </div>
  );
}

// Wrap with memo for performance optimization
export default memo(TreeNodeComponent);
