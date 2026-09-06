/**
 * TreeControls - Controles de navegación del árbol
 * TreeControls - Tree navigation controls
 *
 * Proporciona controles de zoom, fit view, y profundidad del árbol.
 * Provides zoom, fit view, and tree depth controls.
 *
 * Phase 3: Controles para Visual Tree UI.
 * Phase 3: Controls for Visual Tree UI.
 *
 * @module components/tree/TreeControls
 */
import { ZoomIn, ZoomOut, Maximize2, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TreeControlsProps {
  /** Nivel de zoom actual */
  zoomLevel: number;
  /** Profundidad actual del árbol */
  depth: number;
  /** Callback de zoom in */
  onZoomIn: () => void;
  /** Callback de zoom out */
  onZoomOut: () => void;
  /** Callback de fit view */
  onFitView: () => void;
  /** Callback de cambio de profundidad */
  onDepthChange: (depth: number) => void;
}

export default function TreeControls({
  zoomLevel,
  depth,
  onZoomIn,
  onZoomOut,
  onFitView,
  onDepthChange,
}: TreeControlsProps) {
  const { t } = useTranslation();
  const depthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const zoomPercentage = Math.round(zoomLevel * 100);

  return (
    <div className="flex items-center gap-2 bg-[var(--color-card)] rounded-lg shadow-sm border border-[var(--color-border)] p-1">
      {/* Zoom out */}
      <button
        onClick={onZoomOut}
        disabled={zoomLevel <= 0.25}
        className={`
          p-2 rounded-md transition-colors
          ${
            zoomLevel <= 0.25
              ? 'text-[var(--color-foreground-muted)] cursor-not-allowed'
              : 'text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)]'
          }
        `}
        title={t('tree.controls.zoomOut')}
        aria-label={t('tree.controls.zoomOut')}
      >
        <ZoomOut className="w-5 h-5" />
      </button>

      {/* Zoom level indicator - hidden on small screens */}
      <span className="hidden sm:inline min-w-[3rem] text-center text-sm font-medium text-[var(--color-foreground-muted)]">
        {zoomPercentage}%
      </span>

      {/* Zoom in */}
      <button
        onClick={onZoomIn}
        disabled={zoomLevel >= 2}
        className={`
          p-2 rounded-md transition-colors
          ${zoomLevel >= 2 ? 'text-[var(--color-foreground-muted)] cursor-not-allowed' : 'text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)]'}
        `}
        title={t('tree.controls.zoomIn')}
        aria-label={t('tree.controls.zoomIn')}
      >
        <ZoomIn className="w-5 h-5" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-[var(--color-muted)] mx-1" />

      {/* Fit view */}
      <button
        onClick={onFitView}
        className="p-2 rounded-md text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)] transition-colors"
        title={t('tree.controls.fitView')}
        aria-label={t('tree.controls.fitView')}
      >
        <Maximize2 className="w-5 h-5" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-[var(--color-muted)] mx-1" />

      {/* Depth selector */}
      <div className="flex items-center gap-1">
        <Layers className="w-4 h-4 text-[var(--color-foreground-muted)]" />
        <select
          value={depth}
          onChange={(e) => onDepthChange(Number(e.target.value))}
          className="
            text-sm border border-[var(--color-border)] rounded px-2 py-1
            bg-[var(--color-card)] text-[var(--color-foreground)]
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            cursor-pointer
          "
          title={t('tree.controls.depth')}
          aria-label={t('tree.controls.depth')}
        >
          {depthOptions.map((d) => (
            <option key={d} value={d}>
              {d} {t(d === 1 ? 'tree.controls.level' : 'tree.controls.level')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
