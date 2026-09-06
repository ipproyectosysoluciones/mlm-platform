/**
 * CRM - Customer Relationship Management
 * Gestión de Leads, Tasks y Communications / Lead, Task, and Communication Management
 *
 * @module pages/CRM
 *
 * Thin orchestration layer — delegates to hooks and components.
 * Tab state, active section rendering, and top-level layout only.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import {
  ArrowLeft,
  Plus,
  Download,
  Upload,
  X,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  CheckCircle,
} from 'lucide-react';
import { crmService } from '../services/api';
import {
  KanbanBoard,
  LeadList,
  TaskList,
  StatsOverview,
  AnalyticsPanel,
  LeadModal,
  initialLeadFormData,
} from '../components/crm';
import { useCRMLeads } from '../hooks/useCRMLeads';
import { CRM_TABS, EMAIL_TEMPLATES, STATUS_COLORS } from '../features/crm/constants';
import type { CRMTab } from '../features/crm/constants';

export default function CRM() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CRMTab>('leads');

  // ── Lead state ──────────────────────────────────────────────────────
  const {
    leads,
    leadsLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    valueMin,
    setValueMin,
    valueMax,
    setValueMax,
    showAdvancedFilters,
    setShowAdvancedFilters,
    selectedLead,
    setSelectedLead,
    leadTasks,
    leadCommunications,
    showLeadForm,
    setShowLeadForm,
    leadFormData,
    setLeadFormData,
    editingLead,
    setEditingLead,
    selectedTemplate,
    setSelectedTemplate,
    showEmailTemplates,
    setShowEmailTemplates,
    loadLeads,
    loadLeadDetails,
    handleCreateLead,
    handleUpdateLead,
    handleDeleteLead,
    handleStatusChange,
    handleTaskComplete,
    handleExportLeads,
  } = useCRMLeads();

  // ── Import modal state ──────────────────────────────────────────────
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
    total: number;
  } | null>(null);

  const handleImportFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csv = event.target?.result as string;
      setImporting(true);
      try {
        const result = await crmService.importLeads(csv);
        setImportResult(result.data);
      } catch {
        setImportResult({ imported: 0, errors: ['Import failed'], total: 0 });
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportResult(null);
    loadLeads();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t('crm.title')}</h1>
            <p className="text-[var(--color-foreground-muted)] text-sm">{t('crm.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowLeadForm(true);
              setEditingLead(null);
              setLeadFormData(initialLeadFormData);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            {t('crm.newLead')}
          </button>
          <button
            onClick={handleExportLeads}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            {t('crm.exportCSV')}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-secondary)] text-[var(--color-foreground)] rounded-xl hover:bg-[var(--color-muted)] transition-colors font-medium"
          >
            <Upload className="w-5 h-5" />
            {t('crm.importCSV')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[var(--color-card)] border-b border-[var(--color-border)] rounded-t-xl">
        <div className="px-4">
          <div className="flex gap-8">
            {CRM_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {t(`crm.tabs.${tab}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[var(--color-card)] rounded-b-xl rounded-t-none border border-t-0 border-[var(--color-border)] p-6">
        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="flex gap-6">
            <LeadList
              leads={leads}
              leadsLoading={leadsLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sourceFilter={sourceFilter}
              setSourceFilter={setSourceFilter}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              valueMin={valueMin}
              setValueMin={setValueMin}
              valueMax={valueMax}
              setValueMax={setValueMax}
              showAdvancedFilters={showAdvancedFilters}
              setShowAdvancedFilters={setShowAdvancedFilters}
              onNewLead={() => {
                setShowLeadForm(true);
                setEditingLead(null);
                setLeadFormData(initialLeadFormData);
              }}
              onLeadClick={loadLeadDetails}
            />

            {/* Lead Details Panel */}
            {selectedLead && (
              <div className="w-96 bg-[var(--color-secondary)] rounded-xl p-6 h-fit sticky top-6 border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{t('crm.leadDetails')}</h2>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground-muted)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-lg">
                      {selectedLead.contactName[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-foreground)]">{selectedLead.contactName}</h3>
                      <select
                        value={selectedLead.status}
                        onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                        className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[selectedLead.status]?.bg || 'bg-[var(--color-secondary)]'
                        } ${STATUS_COLORS[selectedLead.status]?.text || 'text-[var(--color-foreground)]'}`}
                      >
                        {[
                          'new',
                          'contacted',
                          'qualified',
                          'proposal',
                          'negotiation',
                          'won',
                          'lost',
                        ].map((status) => (
                          <option key={status} value={status}>
                            {t(`crm.status.${status}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-[var(--color-foreground-muted)]" />
                      <span className="text-[var(--color-foreground-muted)]">{selectedLead.contactEmail}</span>
                    </div>
                    {selectedLead.contactPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-[var(--color-foreground-muted)]" />
                        <span className="text-[var(--color-foreground-muted)]">{selectedLead.contactPhone}</span>
                      </div>
                    )}
                    {selectedLead.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-[var(--color-foreground-muted)]" />
                        <span className="text-[var(--color-foreground-muted)]">{selectedLead.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tasks section */}
                <div className="mb-6">
                  <h4 className="font-medium text-[var(--color-foreground)] mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {t('crm.tasksLabel')} ({leadTasks.length})
                  </h4>
                  {leadTasks.length === 0 ? (
                    <p className="text-sm text-[var(--color-foreground-muted)]">{t('crm.noTasks')}</p>
                  ) : (
                    <div className="space-y-2">
                      {leadTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-2 bg-[var(--color-card)] rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={(e) => handleTaskComplete(task.id, e.target.checked)}
                            className="rounded text-emerald-500"
                          />
                          <span
                            className={`flex-1 text-sm ${
                              task.status === 'completed' ? 'line-through text-[var(--color-foreground-muted)]' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick notes */}
                <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                  <h3 className="font-medium text-[var(--color-foreground)] mb-3">{t('crm.quickNotes')}</h3>
                  <div className="space-y-2 mb-3">
                    {leadCommunications
                      .filter((c) => c.type === 'note')
                      .slice(0, 3)
                      .map((note) => (
                        <div
                          key={note.id}
                          className="text-sm bg-yellow-50 p-2 rounded-lg border border-yellow-100"
                        >
                          <p className="text-[var(--color-foreground)]">{note.content}</p>
                          <p className="text-xs text-[var(--color-foreground-muted)] mt-1">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                  </div>
                  <input
                    type="text"
                    placeholder={t('crm.addQuickNote')}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (!input.value.trim()) return;
                        try {
                          await crmService.addCommunication(selectedLead.id, {
                            type: 'note',
                            direction: 'outbound',
                            content: input.value.trim(),
                          });
                          input.value = '';
                          loadLeadDetails(selectedLead.id);
                        } catch (error) {
                          console.error('Failed to add note:', error);
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-[var(--color-foreground-muted)] mt-1">{t('crm.quickNoteHint')}</p>
                </div>

                {/* Email templates */}
                <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-[var(--color-foreground)]">{t('crm.emailTemplates')}</h3>
                    <button
                      onClick={() => setShowEmailTemplates(!showEmailTemplates)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {showEmailTemplates ? t('crm.hideTemplates') : t('crm.showTemplates')}
                    </button>
                  </div>

                  {showEmailTemplates && (
                    <div className="space-y-2">
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg"
                      >
                        <option value="">{t('crm.selectTemplate')}</option>
                        {EMAIL_TEMPLATES.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name[i18n.language as 'es' | 'en'] || template.name.es}
                          </option>
                        ))}
                      </select>

                      {selectedTemplate && (
                        <button
                          onClick={() => {
                            const template = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate);
                            if (template) {
                              const lang = i18n.language as 'es' | 'en';
                              const content = template.content[lang] || template.content.es;
                              const filled = content
                                .replace(/{{name}}/g, selectedLead.contactName)
                                .replace(/{{myName}}/g, 'Tu Nombre');
                              const mailto = `mailto:${selectedLead.contactEmail}?subject=${encodeURIComponent(template.subject[lang] || template.subject.es)}&body=${encodeURIComponent(filled)}`;
                              window.open(mailto, '_blank');
                            }
                          }}
                          className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          {t('crm.sendEmail')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit / Delete */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                      setEditingLead(selectedLead);
                      setLeadFormData({
                        contactName: selectedLead.contactName,
                        contactEmail: selectedLead.contactEmail,
                        contactPhone: selectedLead.contactPhone || '',
                        company: selectedLead.company || '',
                        source: selectedLead.source,
                        notes: selectedLead.notes || '',
                      });
                      setShowLeadForm(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {t('crm.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kanban Tab */}
        {activeTab === 'kanban' && <KanbanBoard />}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && <TaskList />}

        {/* Stats Tab */}
        {activeTab === 'stats' && <StatsOverview />}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && <AnalyticsPanel />}
      </div>

      {/* Lead Modal */}
      <LeadModal
        isOpen={showLeadForm}
        onClose={() => {
          setShowLeadForm(false);
          setEditingLead(null);
          setLeadFormData(initialLeadFormData);
        }}
        onSubmit={editingLead ? handleUpdateLead : handleCreateLead}
        formData={leadFormData}
        onFormDataChange={setLeadFormData}
        editingLead={editingLead}
      />

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-card)] rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{t('crm.importCSV')}</h2>
            </div>

            <div className="p-6">
              {importResult ? (
                <div>
                  <div className="mb-4 p-4 bg-emerald-50 rounded-xl">
                    <p className="font-medium text-emerald-700">
                      {t('crm.imported')}: {importResult.imported} / {importResult.total}
                    </p>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mb-4">
                      <p className="font-medium text-[var(--color-foreground)] mb-2">{t('crm.errors')}:</p>
                      <div className="max-h-40 overflow-y-auto bg-[var(--color-secondary)] rounded-lg p-2 text-sm">
                        {importResult.errors.map((err, i) => (
                          <p key={i} className="text-red-600">
                            {err}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={closeImportModal}
                    className="w-full px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
                  >
                    {t('crm.close')}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-[var(--color-foreground-muted)] mb-4">{t('crm.importInstructions')}</p>
                  <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-6 text-center mb-4">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImportFile(file);
                      }}
                      className="hidden"
                      id="csv-upload"
                    />
                    {importing ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                        <span className="ml-2 text-[var(--color-foreground-muted)]">{t('crm.importing')}</span>
                      </div>
                    ) : (
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-[var(--color-foreground-muted)] mx-auto mb-2" />
                        <p className="text-[var(--color-foreground-muted)]">{t('crm.selectFile')}</p>
                        <p className="text-sm text-[var(--color-foreground-muted)]">CSV</p>
                      </label>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportResult(null);
                      }}
                      className="px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-secondary)]"
                    >
                      {t('crm.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
