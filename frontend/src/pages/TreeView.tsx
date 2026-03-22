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
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, TreeDeciduous, Loader2 } from 'lucide-react';
import TreeNodeComponent from '../components/tree/TreeNodeComponent';
import SearchBar from '../components/tree/SearchBar';
import DetailsPanel from '../components/tree/DetailsPanel';
import TreeControls from '../components/tree/TreeControls';
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
 * Calcula posiciones para nodos del árbol usando un layout jerárquico
 */
function calculateLayout(tree: TreeNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Calculate node positions recursively
  const calculatePositions = (node: TreeNode, x: number, y: number) => {
    const nodeId = node.id;

    // Create node
    nodes.push({
      id: nodeId,
      type: 'treeNode',
      position: { x, y },
      data: {
        label: node,
      },
    });

    // Calculate children positions
    if (node.children && node.children.length > 0) {
      const childCount = node.children.length;
      const totalWidth = childCount * NODE_WIDTH + (childCount - 1) * HORIZONTAL_SPACING;
      const startX = x - totalWidth / 2 + NODE_WIDTH / 2;

      node.children.forEach((child, index) => {
        const childX = startX + index * (NODE_WIDTH + HORIZONTAL_SPACING);
        const childY = y + LEVEL_HEIGHT;

        // Create edge from parent to child
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

        // Recursively calculate child positions
        calculatePositions(child, childX, childY);
      });
    }
  };

  // Start from center of canvas
  const centerX = 0;
  const centerY = 0;
  calculatePositions(tree, centerX, centerY);

  return { nodes, edges };
}

/**
 * TreeView Component
 * Componente principal de visualización del árbol
 */
export default function TreeView() {
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Store state
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

  // React Flow state with proper types
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Load tree data
  useEffect(() => {
    const loadTree = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const treeData = await treeService.getMyTree(depth);
        setTree(treeData);
      } catch (err) {
        console.error('Failed to load tree:', err);
        setError('Failed to load tree. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTree();
  }, [depth, setTree]);

  // Calculate layout when tree changes
  useEffect(() => {
    if (tree && reactFlowInstance) {
      const { nodes: layoutNodes, edges: layoutEdges } = calculateLayout(tree);
      setNodes(layoutNodes);
      setEdges(layoutEdges);

      // Fit view after layout calculation
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [tree, reactFlowInstance, setNodes, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    selectNode(null);
    toggleDetailsPanel(false);
  }, [selectNode, toggleDetailsPanel]);

  // Handle search result selection
  const handleSearchSelect = useCallback(
    (userId: string) => {
      selectNode(userId);

      // Center on the node
      if (reactFlowInstance) {
        const foundNode = nodes.find((n) => n.id === userId);
        if (foundNode) {
          reactFlowInstance.setCenter(foundNode.position.x, foundNode.position.y, {
            zoom: 1,
            duration: 500,
          });
        }
      }
    },
    [selectNode, reactFlowInstance, nodes]
  );

  // Handle view subtree from details panel
  const handleViewSubtree = useCallback(
    (userId: string) => {
      selectNode(userId);
      toggleDetailsPanel(false);

      // Reload with this node as root
      const loadSubtree = async () => {
        setIsLoading(true);
        try {
          const subtreeData = await treeService.getTree(userId, depth);
          setTree(subtreeData);
        } catch (err) {
          console.error('Failed to load subtree:', err);
          setError('Failed to load subtree. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

      loadSubtree();
    },
    [depth, selectNode, toggleDetailsPanel, setTree]
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn({ duration: 200 });
    setZoomLevel(zoomLevel + 0.1);
  }, [reactFlowInstance, zoomLevel, setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut({ duration: 200 });
    setZoomLevel(zoomLevel - 0.1);
  }, [reactFlowInstance, zoomLevel, setZoomLevel]);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlowInstance]);

  // Calculate current zoom from instance
  useEffect(() => {
    if (reactFlowInstance) {
      const zoom = reactFlowInstance.getZoom();
      setZoomLevel(zoom);
    }
  }, [reactFlowInstance, setZoomLevel]);

  // Empty state
  if (!isLoading && !tree) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <h1 className="text-xl font-bold text-indigo-600">Binary Tree</h1>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <TreeDeciduous className="w-24 h-24 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Members Yet</h2>
          <p className="text-gray-500 text-center max-w-md">
            Your network will appear here once you have referrals. Share your referral link to start
            building your team.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-indigo-600">Binary Tree</h1>
          </div>

          {/* Search bar - hidden on very small screens */}
          <div className="hidden sm:block flex-1 max-w-md mx-2">
            <SearchBar onSelect={handleSearchSelect} />
          </div>

          {/* Controls */}
          <TreeControls
            zoomLevel={zoomLevel}
            depth={depth}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitView={handleFitView}
            onDepthChange={setDepth}
          />
        </div>
      </nav>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading tree...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-xs underline mt-1">
            Dismiss
          </button>
        </div>
      )}

      {/* React Flow canvas */}
      <div className="h-[calc(100vh-72px)]">
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
            className="!bg-white !shadow-lg !border !border-gray-200 !rounded-lg"
          />
          <MiniMap
            nodeColor={(node) => {
              const position = (node.data?.label as TreeNode)?.position;
              return position === 'left' ? '#3b82f6' : '#a855f7';
            }}
            maskColor="rgba(0,0,0,0.1)"
            className="!bg-white !shadow-lg !border !border-gray-200 !rounded-lg"
            style={{ bottom: 20, right: 20 }}
          />
        </ReactFlow>
      </div>

      {/* Details panel - only render when open */}
      {isDetailsPanelOpen && (
        <DetailsPanel
          user={selectedNodeDetails}
          isLoading={isStoreLoading}
          onClose={() => toggleDetailsPanel(false)}
          onViewSubtree={handleViewSubtree}
        />
      )}
    </div>
  );
}
