/**
 * @fileoverview EmailBuilder Component Tests
 * @description Unit tests for the email builder component — WYSIWYG/HTML mode toggle,
 *              variable insertion, preview, validation, and template saving.
 *              Tests unitarios del componente email builder — toggle WYSIWYG/HTML,
 *              inserción de variables, vista previa, validación y guardado de plantillas.
 * @module __tests__/components/EmailBuilder.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmailBuilder } from '../../components/EmailBuilder/EmailBuilder';

// Mock the email campaign store
const mockCreateTemplate = vi.fn();
const mockClearErrors = vi.fn();

vi.mock('../../stores/emailCampaignStore', () => ({
  useEmailTemplates: () => ({
    templates: [],
    selectedTemplate: null,
    isLoading: false,
    isCreatingTemplate: false,
    templateError: null,
    createTemplate: mockCreateTemplate,
    fetchTemplates: vi.fn(),
    selectTemplate: vi.fn(),
    clearErrors: mockClearErrors,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('EmailBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the email builder with name, subject, and editor fields', () => {
    render(
      <TestWrapper>
        <EmailBuilder />
      </TestWrapper>
    );

    expect(screen.getByTestId('email-builder')).toBeInTheDocument();
    // i18n mock returns the key as text, so aria-label is the i18n key
    expect(screen.getByLabelText('emailBuilder.templateNameLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('emailBuilder.subjectLineLabel')).toBeInTheDocument();
    expect(screen.getByTestId('wysiwyg-editor')).toBeInTheDocument();
    expect(screen.getByTestId('save-template')).toBeInTheDocument();
  });

  it('should start in WYSIWYG mode and toggle to HTML mode', () => {
    render(
      <TestWrapper>
        <EmailBuilder />
      </TestWrapper>
    );

    // Initially in WYSIWYG mode — editor should exist
    expect(screen.getByTestId('wysiwyg-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('html-editor')).not.toBeInTheDocument();

    // Click mode toggle to switch to HTML
    const toggleBtn = screen.getByTestId('mode-toggle');
    fireEvent.click(toggleBtn);

    expect(screen.queryByTestId('wysiwyg-editor')).not.toBeInTheDocument();
    expect(screen.getByTestId('html-editor')).toBeInTheDocument();
  });

  it('should toggle back from HTML to WYSIWYG mode', () => {
    render(
      <TestWrapper>
        <EmailBuilder />
      </TestWrapper>
    );

    // Go to HTML mode
    fireEvent.click(screen.getByTestId('mode-toggle'));
    expect(screen.getByTestId('html-editor')).toBeInTheDocument();

    // Go back to WYSIWYG mode
    fireEvent.click(screen.getByTestId('mode-toggle'));
    expect(screen.getByTestId('wysiwyg-editor')).toBeInTheDocument();
  });

  it('should allow editing HTML content in HTML mode', () => {
    render(
      <TestWrapper>
        <EmailBuilder />
      </TestWrapper>
    );

    // Switch to HTML mode
    fireEvent.click(screen.getByTestId('mode-toggle'));

    const htmlEditor = screen.getByTestId('html-editor') as HTMLTextAreaElement;
    fireEvent.change(htmlEditor, {
      target: { value: '<p>Hello {{firstName}}</p>' },
    });

    expect(htmlEditor.value).toBe('<p>Hello {{firstName}}</p>');
  });

  it('should show validation error when template name is empty on save', async () => {
    render(
      <TestWrapper>
        <EmailBuilder />
      </TestWrapper>
    );

    // Try to save without any data
    const saveBtn = screen.getByTestId('save-template');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toBeInTheDocument();
    });
  });

  it('should show validation error when subject line is empty on save', async () => {
    render(
      <TestWrapper>
        <EmailBuilder />
      </TestWrapper>
    );

    // Fill name only — i18n mock returns the key as aria-label
    const nameInput = screen.getByLabelText('emailBuilder.templateNameLabel');
    fireEvent.change(nameInput, { target: { value: 'My Template' } });

    // Try to save
    const saveBtn = screen.getByTestId('save-template');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toBeInTheDocument();
    });
  });

  it('should show validation error for unknown template variables', async () => {
    render(
      <TestWrapper>
        <EmailBuilder />
      </TestWrapper>
    );

    // Fill name and subject — i18n mock returns the key as aria-label
    fireEvent.change(screen.getByLabelText('emailBuilder.templateNameLabel'), {
      target: { value: 'Test Template' },
    });
    fireEvent.change(screen.getByLabelText('emailBuilder.subjectLineLabel'), {
      target: { value: 'Hello {{unknownVar}}' },
    });

    // Switch to HTML mode and add content
    fireEvent.click(screen.getByTestId('mode-toggle'));
    const htmlEditor = screen.getByTestId('html-editor');
    fireEvent.change(htmlEditor, {
      target: { value: '<p>Content</p>' },
    });

    // Try to save
    fireEvent.click(screen.getByTestId('save-template'));

    await waitFor(() => {
      const error = screen.getByTestId('validation-error');
      expect(error).toBeInTheDocument();
      expect(error.textContent).toContain('unknownVar');
    });
  });

  it('should call createTemplate on valid save in HTML mode', async () => {
    mockCreateTemplate.mockResolvedValue({
      id: 'tpl-1',
      name: 'Newsletter',
      subjectLine: 'Hi {{firstName}}',
      htmlContent: '<p>Hello {{firstName}}</p>',
      variablesUsed: ['firstName'],
      createdAt: '2026-04-04T00:00:00.000Z',
      updatedAt: '2026-04-04T00:00:00.000Z',
    });

    render(
      <TestWrapper>
        <EmailBuilder />
      </TestWrapper>
    );

    // Fill all fields — i18n mock returns the key as aria-label
    fireEvent.change(screen.getByLabelText('emailBuilder.templateNameLabel'), {
      target: { value: 'Newsletter' },
    });
    fireEvent.change(screen.getByLabelText('emailBuilder.subjectLineLabel'), {
      target: { value: 'Hi {{firstName}}' },
    });

    // Switch to HTML mode and add valid content
    fireEvent.click(screen.getByTestId('mode-toggle'));
    fireEvent.change(screen.getByTestId('html-editor'), {
      target: { value: '<p>Hello {{firstName}}</p>' },
    });

    // Save
    fireEvent.click(screen.getByTestId('save-template'));

    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        name: 'Newsletter',
        subjectLine: 'Hi {{firstName}}',
        htmlContent: '<p>Hello {{firstName}}</p>',
      });
    });
  });

  it('should render with initial data when provided', () => {
    render(
      <TestWrapper>
        <EmailBuilder
          initialData={{
            name: 'Prefilled',
            subjectLine: 'Subject Test',
            htmlContent: '<p>Initial content</p>',
          }}
        />
      </TestWrapper>
    );

    // i18n mock returns the key as aria-label
    const nameInput = screen.getByLabelText('emailBuilder.templateNameLabel') as HTMLInputElement;
    const subjectInput = screen.getByLabelText('emailBuilder.subjectLineLabel') as HTMLInputElement;

    expect(nameInput.value).toBe('Prefilled');
    expect(subjectInput.value).toBe('Subject Test');
  });

  it('should render preview pane alongside editor', () => {
    render(
      <TestWrapper>
        <EmailBuilder />
      </TestWrapper>
    );

    // The preview pane should be rendered (PreviewPane component)
    expect(screen.getByTestId('email-builder')).toBeInTheDocument();
    // The grid layout ensures preview is beside editor
    const builder = screen.getByTestId('email-builder');
    expect(builder.className).toContain('grid');
  });

  // ============================================
  // DOMPurify sanitization tests
  // Tests de sanitización DOMPurify
  // ============================================

  describe('DOMPurify sanitization', () => {
    it('should strip <script> tags from HTML content in WYSIWYG mode', () => {
      render(
        <TestWrapper>
          <EmailBuilder />
        </TestWrapper>
      );

      // Switch to HTML mode
      fireEvent.click(screen.getByTestId('mode-toggle'));
      expect(screen.getByTestId('html-editor')).toBeInTheDocument();

      // Input HTML with a script tag (XSS attack vector)
      const htmlEditor = screen.getByTestId('html-editor');
      fireEvent.change(htmlEditor, {
        target: { value: "<p>Hello</p><script>alert('xss')</script>" },
      });

      // Switch back to WYSIWYG — content passes through sanitizeHtml()
      fireEvent.click(screen.getByTestId('mode-toggle'));

      // The WYSIWYG editor should render sanitized HTML — no <script> tags
      const wysiwygEditor = screen.getByTestId('wysiwyg-editor');
      expect(wysiwygEditor.innerHTML).not.toContain('<script>');
      expect(wysiwygEditor.innerHTML).not.toContain('</script>');
      // The safe part should be preserved
      expect(wysiwygEditor.innerHTML).toContain('<p>Hello</p>');
    });

    it('should strip event handler attributes (onerror, onclick, etc.)', () => {
      render(
        <TestWrapper>
          <EmailBuilder />
        </TestWrapper>
      );

      // Switch to HTML mode
      fireEvent.click(screen.getByTestId('mode-toggle'));

      // Input HTML with an onerror event handler (XSS attack vector)
      const htmlEditor = screen.getByTestId('html-editor');
      fireEvent.change(htmlEditor, {
        target: { value: '<img src=x onerror="alert(\'xss\')">' },
      });

      // Switch back to WYSIWYG — content passes through sanitizeHtml()
      fireEvent.click(screen.getByTestId('mode-toggle'));

      // The WYSIWYG editor should NOT contain onerror attribute
      const wysiwygEditor = screen.getByTestId('wysiwyg-editor');
      expect(wysiwygEditor.innerHTML).not.toContain('onerror');
      // The <img> tag itself may or may not survive (DOMPurify keeps it without the handler)
      // but the dangerous attribute MUST be gone
      expect(wysiwygEditor.innerHTML).not.toContain('alert');
    });

    it('should preserve safe HTML elements after sanitization', () => {
      render(
        <TestWrapper>
          <EmailBuilder />
        </TestWrapper>
      );

      // Switch to HTML mode
      fireEvent.click(screen.getByTestId('mode-toggle'));

      // Input safe, valid HTML
      const safeHtml = '<h1>Title</h1><p>Text</p><a href="https://example.com">Link</a>';
      const htmlEditor = screen.getByTestId('html-editor');
      fireEvent.change(htmlEditor, {
        target: { value: safeHtml },
      });

      // Switch back to WYSIWYG — content passes through sanitizeHtml()
      fireEvent.click(screen.getByTestId('mode-toggle'));

      // All safe elements should be preserved
      const wysiwygEditor = screen.getByTestId('wysiwyg-editor');
      expect(wysiwygEditor.querySelector('h1')).toBeTruthy();
      expect(wysiwygEditor.querySelector('h1')?.textContent).toBe('Title');
      expect(wysiwygEditor.querySelector('p')).toBeTruthy();
      expect(wysiwygEditor.querySelector('p')?.textContent).toBe('Text');
      expect(wysiwygEditor.querySelector('a')).toBeTruthy();
      expect(wysiwygEditor.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
      expect(wysiwygEditor.querySelector('a')?.textContent).toBe('Link');
    });
  });
});
