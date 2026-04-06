/**
 * @fileoverview PreviewPane Component - Real-time email HTML preview
 * @description Shows rendered HTML with sample data, updates in real-time as user types
 *              Muestra HTML renderizado con datos de ejemplo, se actualiza en tiempo real
 * @module components/EmailBuilder/PreviewPane
 * @author Nexo Real Development Team
 */

import { useMemo } from 'react';
import { Eye } from 'lucide-react';
import DOMPurify from 'dompurify';
import { cn } from '../../utils/cn';

/**
 * PreviewPane component props
 * Props del componente PreviewPane
 */
interface PreviewPaneProps {
  /** Raw HTML content to preview / Contenido HTML crudo para previsualizar */
  htmlContent: string;
  /** Subject line to preview / Línea de asunto para previsualizar */
  subjectLine?: string;
  /** Additional CSS classes / Clases CSS adicionales */
  className?: string;
}

/**
 * Sample data for template variable replacement / Datos de ejemplo para reemplazo de variables
 */
const SAMPLE_DATA: Record<string, string> = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  referralCode: 'REF-ABC123',
  discountCode: 'SAVE20',
  expiresAt: '2026-04-30',
};

/**
 * Replace template variables with sample data
 * Reemplazar variables de plantilla con datos de ejemplo
 */
function renderWithSampleData(content: string): string {
  let rendered = content;
  Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  return rendered;
}

/**
 * Sanitize HTML to prevent DOM XSS attacks
 * Sanitizar HTML para prevenir ataques DOM XSS
 */
const sanitizeHtml = (html: string): string => DOMPurify.sanitize(html);

/**
 * PreviewPane - Real-time rendered HTML preview with sample data
 * PreviewPane - Vista previa de HTML renderizado en tiempo real con datos de ejemplo
 */
export function PreviewPane({ htmlContent, subjectLine, className }: PreviewPaneProps) {
  const renderedHtml = useMemo(() => renderWithSampleData(htmlContent), [htmlContent]);
  const renderedSubject = useMemo(
    () => (subjectLine ? renderWithSampleData(subjectLine) : ''),
    [subjectLine]
  );

  return (
    <div
      className={cn('flex flex-col rounded-lg border border-slate-600 bg-slate-900', className)}
      data-testid="preview-pane"
    >
      {/* Header / Encabezado */}
      <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-2">
        <Eye className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-300">Preview</span>
        <span className="text-xs text-slate-500">(with sample data)</span>
      </div>

      {/* Subject preview / Vista previa del asunto */}
      {renderedSubject && (
        <div className="border-b border-slate-700 px-4 py-2">
          <span className="text-xs text-slate-500">Subject: </span>
          <span className="text-sm text-slate-200" data-testid="preview-subject">
            {renderedSubject}
          </span>
        </div>
      )}

      {/* HTML preview / Vista previa HTML */}
      <div className="flex-1 overflow-auto p-4">
        {htmlContent ? (
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 16px; color: #1a1a1a; background: #ffffff; }
                    img { max-width: 100%; height: auto; }
                  </style>
                </head>
                <body>${sanitizeHtml(renderedHtml)}</body>
              </html>
            `}
            className="w-full min-h-[300px] rounded border-0 bg-white"
            title="Email preview"
            sandbox="allow-same-origin"
            data-testid="preview-iframe"
          />
        ) : (
          <div className="flex min-h-[300px] items-center justify-center text-slate-500">
            <p>Start typing to see a preview...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewPane;
