/**
 * @fileoverview EmailBuilder Component - WYSIWYG + HTML toggle email editor
 * @description Main email builder with WYSIWYG editing, HTML mode, variable picker,
 *              and real-time preview. Lightweight approach without TinyMCE.
 *              Constructor de email principal con edición WYSIWYG, modo HTML, selector
 *              de variables y vista previa en tiempo real. Enfoque liviano sin TinyMCE.
 * @module components/EmailBuilder/EmailBuilder
 * @author MLM Platform
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Save,
  Loader2,
  AlertCircle,
  Code,
  Eye,
  Bold,
  Italic,
  Link,
  Image,
  Heading1,
  Heading2,
  List,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { VariablePicker } from './VariablePicker';
import { PreviewPane } from './PreviewPane';
import { useEmailTemplates } from '../../stores/emailCampaignStore';
import { ALLOWED_TEMPLATE_VARIABLES } from '../../types';
import type { EmailTemplateCreatePayload } from '../../types';

// ============================================
// Types / Tipos
// ============================================

/**
 * EmailBuilder component props
 * Props del componente EmailBuilder
 */
interface EmailBuilderProps {
  /** Initial template data for editing / Datos iniciales de plantilla para edición */
  initialData?: {
    name: string;
    subjectLine: string;
    htmlContent: string;
  };
  /** Callback on successful save / Callback al guardar exitosamente */
  onSave?: (template: { name: string; subjectLine: string; htmlContent: string }) => void;
}

/** Editor mode type / Tipo de modo del editor */
type EditorMode = 'wysiwyg' | 'html';

// ============================================
// Validation / Validación
// ============================================

/**
 * Validate template variables in content
 * Validar variables de plantilla en el contenido
 */
function validateTemplateVariables(content: string): {
  valid: boolean;
  error?: string;
  unknownVars?: string[];
} {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const unknownVars: string[] = [];
  let match;

  while ((match = variableRegex.exec(content))) {
    const varName = match[1];
    if (
      !ALLOWED_TEMPLATE_VARIABLES.includes(varName as (typeof ALLOWED_TEMPLATE_VARIABLES)[number])
    ) {
      unknownVars.push(varName);
    }
  }

  if (unknownVars.length > 0) {
    return {
      valid: false,
      error: `Unknown variable(s): ${unknownVars.map((v) => `{{${v}}}`).join(', ')}`,
      unknownVars,
    };
  }

  return { valid: true };
}

// ============================================
// Toolbar Commands / Comandos de toolbar
// ============================================

interface ToolbarAction {
  icon: React.ElementType;
  label: string;
  command: string;
  value?: string;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: Bold, label: 'Bold', command: 'bold' },
  { icon: Italic, label: 'Italic', command: 'italic' },
  { icon: Heading1, label: 'Heading 1', command: 'formatBlock', value: 'h1' },
  { icon: Heading2, label: 'Heading 2', command: 'formatBlock', value: 'h2' },
  { icon: List, label: 'List', command: 'insertUnorderedList' },
  { icon: Link, label: 'Link', command: 'createLink' },
  { icon: Image, label: 'Image', command: 'insertImage' },
];

// ============================================
// Component / Componente
// ============================================

/**
 * EmailBuilder - Main email template builder with WYSIWYG + HTML toggle
 * EmailBuilder - Constructor de plantillas de email principal con WYSIWYG + toggle HTML
 */
export function EmailBuilder({ initialData, onSave }: EmailBuilderProps) {
  const { t } = useTranslation();
  const { createTemplate, isCreatingTemplate, templateError, clearErrors } = useEmailTemplates();

  // Form state
  const [templateName, setTemplateName] = useState(initialData?.name ?? '');
  const [subjectLine, setSubjectLine] = useState(initialData?.subjectLine ?? '');
  const [htmlContent, setHtmlContent] = useState(initialData?.htmlContent ?? '');
  const [mode, setMode] = useState<EditorMode>('wysiwyg');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // Editor Actions / Acciones del editor
  // ==========================================

  /**
   * Execute a formatting command in WYSIWYG mode
   * Ejecutar un comando de formato en modo WYSIWYG
   */
  const executeCommand = useCallback((command: string, value?: string) => {
    if (command === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) {
        document.execCommand('createLink', false, url);
      }
      return;
    }
    if (command === 'insertImage') {
      const url = prompt('Enter image URL:');
      if (url) {
        document.execCommand('insertImage', false, url);
      }
      return;
    }
    if (command === 'formatBlock' && value) {
      document.execCommand('formatBlock', false, `<${value}>`);
      return;
    }
    document.execCommand(command, false, value);
  }, []);

  /**
   * Sync WYSIWYG content to state
   * Sincronizar contenido WYSIWYG al estado
   */
  const syncWysiwygContent = useCallback(() => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  }, []);

  /**
   * Insert a template variable at cursor position
   * Insertar una variable de plantilla en la posición del cursor
   */
  const handleVariableInsert = useCallback(
    (variable: string) => {
      if (mode === 'wysiwyg' && editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertText', false, variable);
        syncWysiwygContent();
      } else {
        // In HTML mode, insert at the end or at cursor (simplified)
        setHtmlContent((prev) => prev + variable);
      }
      if (validationError) setValidationError(null);
    },
    [mode, syncWysiwygContent, validationError]
  );

  /**
   * Toggle between WYSIWYG and HTML mode
   * Alternar entre modo WYSIWYG y HTML
   */
  const handleModeToggle = useCallback(() => {
    if (mode === 'wysiwyg') {
      // Sync WYSIWYG → HTML
      if (editorRef.current) {
        setHtmlContent(editorRef.current.innerHTML);
      }
      setMode('html');
    } else {
      // Sync HTML → WYSIWYG (will be picked up by the editor's dangerouslySetInnerHTML)
      setMode('wysiwyg');
    }
  }, [mode]);

  // ==========================================
  // Form Actions / Acciones del formulario
  // ==========================================

  /**
   * Validate form before saving
   * Validar formulario antes de guardar
   */
  const validateForm = (): string | null => {
    if (!templateName.trim()) {
      return t('emailBuilder.nameRequired') || 'Template name is required';
    }
    if (!subjectLine.trim()) {
      return t('emailBuilder.subjectRequired') || 'Subject line is required';
    }

    // Sync content from WYSIWYG if needed
    const content =
      mode === 'wysiwyg' && editorRef.current ? editorRef.current.innerHTML : htmlContent;

    if (!content.trim()) {
      return t('emailBuilder.contentRequired') || 'Email content is required';
    }

    // Validate variables in both content and subject
    const contentValidation = validateTemplateVariables(content);
    if (!contentValidation.valid) {
      return contentValidation.error!;
    }

    const subjectValidation = validateTemplateVariables(subjectLine);
    if (!subjectValidation.valid) {
      return subjectValidation.error!;
    }

    return null;
  };

  /**
   * Handle form save
   * Manejar guardado del formulario
   */
  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    // Get final content
    const finalContent =
      mode === 'wysiwyg' && editorRef.current ? editorRef.current.innerHTML : htmlContent;

    setIsSaving(true);
    setValidationError(null);

    try {
      const templateData: EmailTemplateCreatePayload = {
        name: templateName.trim(),
        subjectLine: subjectLine.trim(),
        htmlContent: finalContent,
      };

      await createTemplate(templateData);
      toast.success(t('emailBuilder.saved') || 'Template saved successfully!');
      onSave?.({
        name: templateData.name,
        subjectLine: templateData.subjectLine,
        htmlContent: templateData.htmlContent,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save template';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // Render
  // ==========================================

  const isSubmitting = isSaving || isCreatingTemplate;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" data-testid="email-builder">
      {/* Editor panel / Panel del editor */}
      <div className="space-y-4">
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Type className="h-5 w-5 text-purple-400" />
              {t('emailBuilder.title') || 'Email Builder'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Name / Nombre de plantilla */}
            <div>
              <Label htmlFor="template-name" className="text-slate-300">
                {t('emailBuilder.templateName') || 'Template Name'}
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Weekly Newsletter"
                className="mt-1.5 bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500"
                disabled={isSubmitting}
                aria-label={t('emailBuilder.templateNameLabel') || 'Template name'}
              />
            </div>

            {/* Subject Line / Línea de asunto */}
            <div>
              <Label htmlFor="subject-line" className="text-slate-300">
                {t('emailBuilder.subjectLine') || 'Subject Line'}
              </Label>
              <Input
                id="subject-line"
                value={subjectLine}
                onChange={(e) => {
                  setSubjectLine(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Hi {{firstName}}, check out our deals!"
                className="mt-1.5 bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500"
                disabled={isSubmitting}
                aria-label={t('emailBuilder.subjectLineLabel') || 'Subject line'}
              />
              <p className="mt-1 text-xs text-slate-500">
                {t('emailBuilder.subjectHint') || 'Supports variables like {{firstName}}'}
              </p>
            </div>

            {/* Toolbar / Barra de herramientas */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3">
              {/* Mode toggle / Toggle de modo */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleModeToggle}
                className={cn(
                  'border-slate-600 gap-1',
                  mode === 'html'
                    ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                    : 'text-slate-200 hover:bg-slate-700'
                )}
                aria-label={mode === 'wysiwyg' ? 'Switch to HTML mode' : 'Switch to WYSIWYG mode'}
                data-testid="mode-toggle"
              >
                {mode === 'wysiwyg' ? (
                  <>
                    <Code className="h-4 w-4" />
                    HTML
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    WYSIWYG
                  </>
                )}
              </Button>

              {/* Formatting buttons (WYSIWYG only) / Botones de formato (solo WYSIWYG) */}
              {mode === 'wysiwyg' && (
                <>
                  <div className="h-6 w-px bg-slate-600" />
                  {TOOLBAR_ACTIONS.map((action) => (
                    <Button
                      key={action.command + (action.value || '')}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => executeCommand(action.command, action.value)}
                      className="h-8 w-8 p-0 text-slate-300 hover:bg-slate-700 hover:text-white"
                      aria-label={action.label}
                      title={action.label}
                    >
                      <action.icon className="h-4 w-4" />
                    </Button>
                  ))}
                </>
              )}

              <div className="h-6 w-px bg-slate-600" />

              {/* Variable picker / Selector de variables */}
              <VariablePicker onSelect={handleVariableInsert} disabled={isSubmitting} />
            </div>

            {/* Editor area / Área del editor */}
            {mode === 'wysiwyg' ? (
              <div
                ref={editorRef}
                contentEditable
                role="textbox"
                aria-label={t('emailBuilder.editorLabel') || 'Email content editor'}
                aria-multiline="true"
                className={cn(
                  'min-h-[300px] rounded-lg border border-slate-600 bg-white p-4',
                  'text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500',
                  'prose prose-sm max-w-none'
                )}
                onInput={syncWysiwygContent}
                onBlur={syncWysiwygContent}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                data-testid="wysiwyg-editor"
              />
            ) : (
              <textarea
                value={htmlContent}
                onChange={(e) => {
                  setHtmlContent(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                className={cn(
                  'min-h-[300px] w-full rounded-lg border border-slate-600 bg-slate-900 p-4',
                  'font-mono text-sm text-emerald-300 placeholder:text-slate-500',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500',
                  'resize-y'
                )}
                placeholder="<html>&#10;  <body>&#10;    <p>Hi {{firstName}},</p>&#10;  </body>&#10;</html>"
                disabled={isSubmitting}
                aria-label={t('emailBuilder.htmlEditorLabel') || 'HTML code editor'}
                data-testid="html-editor"
              />
            )}

            {/* Validation error / Error de validación */}
            {(validationError || templateError) && (
              <div
                className="flex items-center gap-2 text-sm text-red-400"
                role="alert"
                data-testid="validation-error"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{validationError || templateError}</span>
              </div>
            )}

            {/* Save button / Botón de guardar */}
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className={cn(
                'w-full',
                !isSubmitting
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              )}
              data-testid="save-template"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('emailBuilder.saving') || 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('emailBuilder.save') || 'Save Template'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview panel / Panel de vista previa */}
      <div>
        <PreviewPane
          htmlContent={htmlContent}
          subjectLine={subjectLine}
          className="sticky top-4 min-h-[500px]"
        />
      </div>
    </div>
  );
}

export default EmailBuilder;
