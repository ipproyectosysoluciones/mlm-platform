/**
 * @fileoverview Client-side Tree component
 * @description Interactive tree visualization component with client-side state management
 *              Componente de árbol interactivo con manejo de estado del lado del cliente
 * @module components/client/TreeClient
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { treeService } from '../../services/api';
import { useData } from '../../hooks/useData';
import type { TreeNode } from '../../types';

interface TreeClientProps {
  userId?: string;
  initialData?: TreeNode;
  maxDepth?: number;
  onNodeClick?: (node: TreeNode) => void;
}

/**
 * Client-side Tree component
 * Handles all interactive features and state
 */
export function TreeClient({
  userId,
  initialData,
  maxDepth = 3,
  onNodeClick,
}: TreeClientProps): ReactNode {
  const [treeData, setTreeData] = useState<TreeNode | null>(initialData ?? null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  // Use the data fetching hook
  const { data, error, isLoading, refetch } = useData({
    fetcher: () =>
      userId ? treeService.getTree(userId, maxDepth) : treeService.getMyTree(maxDepth),
    fallback: initialData ?? undefined,
  });

  useEffect(() => {
    if (data) {
      setTreeData(data);
      // Auto-expand first level
      if (data.children?.length) {
        setExpandedNodes(new Set([data.id]));
      }
    }
  }, [data]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeClick = useCallback(
    (node: TreeNode) => {
      setSelectedNode(node);
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  if (isLoading && !treeData) {
    return <TreeSkeleton />;
  }

  if (error) {
    return <TreeError error={error} onRetry={() => refetch()} />;
  }

  if (!treeData) {
    return <TreeEmpty />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <TreeVisualization
          node={treeData}
          expandedNodes={expandedNodes}
          selectedNode={selectedNode}
          onToggle={toggleNode}
          onNodeClick={handleNodeClick}
        />
      </div>
      {selectedNode && (
        <div className="w-full lg:w-80">
          <TreeNodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      )}
    </div>
  );
}

/**
 * Tree visualization component
 */
function TreeVisualization({
  node,
  expandedNodes,
  selectedNode,
  onToggle,
  onNodeClick,
}: {
  node: TreeNode;
  expandedNodes: Set<string>;
  selectedNode: TreeNode | null;
  onToggle: (id: string) => void;
  onNodeClick: (node: TreeNode) => void;
}): ReactNode {
  const isExpanded = expandedNodes.has(node.id);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <TreeNodeComponent
        node={node}
        isExpanded={isExpanded}
        selectedNode={selectedNode}
        expandedNodes={expandedNodes}
        depth={0}
        onToggle={onToggle}
        onNodeClick={onNodeClick}
      />
    </div>
  );
}

/**
 * Individual tree node component
 */
function TreeNodeComponent({
  node,
  isExpanded,
  selectedNode,
  expandedNodes,
  depth,
  onToggle,
  onNodeClick,
}: {
  node: TreeNode;
  isExpanded: boolean;
  selectedNode: TreeNode | null;
  expandedNodes: Set<string>;
  depth: number;
  onToggle: (id: string) => void;
  onNodeClick: (node: TreeNode) => void;
}): ReactNode {
  const hasChildren = node.children && node.children.length > 0;
  const canExpand = hasChildren && depth < 3;
  const isSelected = selectedNode?.id === node.id;

  return (
    <div className={`${depth > 0 ? 'ml-6' : ''}`}>
      <div
        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
          isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
        }`}
        onClick={() => onNodeClick(node)}
      >
        <div className="flex items-center gap-3">
          {canExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.id);
              }}
              className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!canExpand && <span className="w-6" />}
          <div>
            <p className="font-medium">{node.email}</p>
            <p className="text-xs text-muted-foreground">
              Nivel {node.level} · {node.position === 'left' ? 'Izquierda' : 'Derecha'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            <span className="text-purple-600">{node.stats.leftCount} Izq</span>
            {' · '}
            <span className="text-orange-600">{node.stats.rightCount} Der</span>
          </span>
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div className="border-l-2 border-muted ml-3">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              isExpanded={expandedNodes.has(child.id)}
              selectedNode={selectedNode}
              expandedNodes={expandedNodes}
              depth={depth + 1}
              onToggle={onToggle}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Tree node details panel
 */
function TreeNodeDetails({ node, onClose }: { node: TreeNode; onClose: () => void }): ReactNode {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Detalles del Nodo</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
      <dl className="space-y-3">
        <div>
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="font-medium">{node.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Código de Referido</dt>
          <dd className="font-mono text-sm">{node.referralCode}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Posición</dt>
          <dd>{node.position === 'left' ? 'Izquierda' : 'Derecha'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Nivel</dt>
          <dd>{node.level}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Estadísticas</dt>
          <dd>
            <span className="text-purple-600">Izq: {node.stats.leftCount}</span>
            {' · '}
            <span className="text-orange-600">Der: {node.stats.rightCount}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Skeleton loading state
 */
function TreeSkeleton(): ReactNode {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-muted rounded animate-pulse" />
      <div className="h-12 bg-muted rounded animate-pulse ml-6" />
      <div className="h-12 bg-muted rounded animate-pulse ml-6" />
      <div className="h-12 bg-muted rounded animate-pulse ml-12" />
    </div>
  );
}

/**
 * Error state
 */
function TreeError({ error, onRetry }: { error: Error; onRetry: () => void }): ReactNode {
  return (
    <div className="text-center py-12">
      <p className="text-destructive mb-4">Error: {error.message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Reintentar
      </button>
    </div>
  );
}

/**
 * Empty state
 */
function TreeEmpty(): ReactNode {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No hay datos del árbol disponibles</p>
    </div>
  );
}
