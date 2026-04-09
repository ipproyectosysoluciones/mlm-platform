/**
 * TreeView - Visualización del árbol binario MLM con React Flow
 * TreeView - MLM binary tree visualization with React Flow
 *
 * Implementa pan, zoom, búsqueda, minimap y panel de detalles.
 * Implements pan, zoom, search, minimap, and details panel.
 *
 * Phase 3: Migración de flexbox a React Flow para visualización interactiva.
 * Phase 3: Migration from flexbox to React Flow for interactive visualization.
 *
 * @module pages/TreeView
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, TreeDeciduous, Loader2 } from 'lucide-react';
import {
  TreeNodeComponent,
  TreeSearch,
  TreeDetails,
  TreeControls,
  TreeMinimap,
} from '../components/tree';
import { useTreeStore } from '../stores/treeStore';
import { treeService } from '../services/api';
import type { TreeNode } from '../types';

// Custom node types for React Flow
const nodeTypes: NodeTypes = {
  treeNode: TreeNodeComponent,
};

// Layout constants
const NODE_WIDTH = 180;
const LEVEL_HEIGHT = 140;
const HORIZONTAL_SPACING = 40;

/**
 * Calculates positions for tree nodes using a hierarchical layout
 */
function calculateLayout(tree: TreeNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const calculatePositions = (node: TreeNode, x: number, y: number) => {
    const nodeId = node.id;

    nodes.push({
      id: nodeId,
      type: 'treeNode',
      position: { x, y },
      data: { label: node },
    });

    if (node.children && node.children.length > 0) {
      const childCount = node.children.length;
      const totalWidth = childCount * NODE_WIDTH + (childCount - 1) * HORIZONTAL_SPACING;
      const startX = x - totalWidth / 2 + NODE_WIDTH / 2;

      node.children.forEach((child, index) => {
        const childX = startX + index * (NODE_WIDTH + HORIZONTAL_SPACING);
        const childY = y + LEVEL_HEIGHT;

        edges.push({
          id: `${nodeId}-${child.id}`,
          source: nodeId,
          target: child.id,
          type: 'smoothstep',
          style: {
            stroke: child.position === 'left' ? '#3b82f6' : '#a855f7',
            strokeWidth: 2,
          },
        });

        calculatePositions(child, childX, childY);
      });
    }
  };

  const centerX = 400;
  const centerY = 50;
  calculatePositions(tree, centerX, centerY);

  return { nodes, edges };
}

/**
 * TreeView Component
 */
export default function TreeView() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const {
    tree,
    setTree,
    selectNode,
    selectedNodeDetails,
    toggleDetailsPanel,
    isDetailsPanelOpen,
    depth,
    setDepth,
    zoomLevel,
    setZoomLevel,
    isLoading: isStoreLoading,
  } = useTreeStore();

  const { t } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const loadTree = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const treeData = await treeService.getMyTree(depth);
        setTree(treeData);
      } catch {
        setError('Error al cargar el árbol. Intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };
    loadTree();
  }, [depth, setTree]);

  useEffect(() => {
    if (!tree) return;

    const { nodes: layoutNodes, edges: layoutEdges } = calculateLayout(tree);
    setNodes(layoutNodes);
    setEdges(layoutEdges);

    if (reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [tree, setNodes, setEdges]);

  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [reactFlowInstance, nodes.length]);

  useEffect(() => {
    if (reactFlowInstance) {
      const zoom = reactFlowInstance.getZoom();
      setZoomLevel(zoom);
    }
  }, [reactFlowInstance, setZoomLevel]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const handleSearchSelect = useCallback(
    (nodeId: string) => {
      selectNode(nodeId);
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ nodes: [{ id: nodeId }], padding: 0.5, duration: 300 });
      }
    },
    [selectNode, reactFlowInstance]
  );

  const handleViewSubtree = useCallback(
    (nodeId: string) => {
      setDepth(1);
      const loadSubtree = async () => {
        try {
          const subtree = await treeService.getTree(nodeId, depth);
          setTree(subtree);
        } catch {
          setError('Error al cargar subárbol');
        }
      };
      loadSubtree();
    },
    [depth, setDepth, setTree]
  );

  const handleZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      const zoom = reactFlowInstance.getZoom();
      reactFlowInstance.zoomTo(zoom * 1.2, { duration: 200 });
    }
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      const zoom = reactFlowInstance.getZoom();
      reactFlowInstance.zoomTo(zoom / 1.2, { duration: 200 });
    }
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
    }
  }, [reactFlowInstance]);

  const hasNoReferrals = tree && (!tree.children || tree.children.length === 0);
  const isEmptyTree = !tree || hasNoReferrals;

  if (isEmptyTree) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <TreeDeciduous className="w-24 h-24 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-600 mb-2">{t('tree.empty.title')}</h2>
        <p className="text-slate-500 text-center max-w-md mb-6">{t('tree.empty.description')}</p>
        <Link
          to="/dashboard"
          className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
        >
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)]">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 mb-4 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-slate-900">{t('tree.title')}</h1>
          </div>

          <div className="hidden sm:block flex-1 max-w-md">
            <TreeSearch onSelect={handleSearchSelect} placeholder={t('tree.search.placeholder')} />
          </div>

          <TreeControls
            zoomLevel={zoomLevel}
            depth={depth}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitView={handleFitView}
            onDepthChange={setDepth}
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-xl">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">{t('tree.loading')}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-xs underline mt-1">
            {t('tree.actions.dismiss')}
          </button>
        </div>
      )}

      {/* React Flow canvas */}
      <div className="h-[calc(100%-60px)] bg-white rounded-xl border border-slate-200 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.25}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls
            showZoom={false}
            showFitView={false}
            showInteractive={false}
            className="!bg-white !shadow-lg !border !border-slate-200 !rounded-lg"
          />
          <TreeMinimap />
        </ReactFlow>
      </div>

      {/* Details panel */}
      {isDetailsPanelOpen && (
        <TreeDetails
          user={selectedNodeDetails}
          isLoading={isStoreLoading}
          onClose={() => toggleDetailsPanel(false)}
          onViewSubtree={handleViewSubtree}
        />
      )}
    </div>
  );
}
