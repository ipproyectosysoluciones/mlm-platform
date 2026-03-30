/**
 * TreeMinimap - Minimapa interactivo del árbol
 * TreeMinimap - Interactive tree minimap
 *
 * Wrapper del componente MiniMap de @xyflow/react con configuración
 * consistente para el árbol MLM. Colorea nodos por pierna (left/right).
 *
 * @module components/tree/TreeMinimap
 */
import { MiniMap } from '@xyflow/react';
import type { TreeNode } from '../../types';

interface TreeMinimapProps {
  /** Color de cada nodo basado en su pierna */
  nodeColor?: (node: unknown) => string;
  /** Si permite pan con el mouse */
  pannable?: boolean;
  /** Si permite zoom con el mouse */
  zoomable?: boolean;
}

/** Color por defecto: azul para left, púrpura para right */
const defaultNodeColor = (node: unknown): string => {
  const typedNode = node as { data?: { label?: TreeNode } };
  const position = typedNode.data?.label?.position;
  return position === 'left' ? '#3b82f6' : '#a855f7';
};

export default function TreeMinimap({
  nodeColor = defaultNodeColor,
  pannable = true,
  zoomable = true,
}: TreeMinimapProps) {
  return (
    <MiniMap
      nodeColor={nodeColor as (node: { data?: { label?: TreeNode } }) => string}
      maskColor="rgba(0,0,0,0.1)"
      className="!bg-white !shadow-lg !border !border-slate-200 !rounded-lg"
      style={{
        bottom: 20,
        right: 20,
      }}
      pannable={pannable}
      zoomable={zoomable}
    />
  );
}
