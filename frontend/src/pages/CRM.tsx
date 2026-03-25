/**
 * CRM - Customer Relationship Management
 * Gestión de Leads, Tasks y Communications / Lead, Task, and Communication Management
 *
 * @module pages/CRM
 *
 * @description Bilingual component - Uses i18n for all user-facing text
 * / Componente bilingüe - Usa i18n para todo el texto visible
 *
 * @example
 * // All text uses t() function from react-i18next
 * const { t } = useTranslation();
 * <h1>{t('crm.title')}</h1>
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import {
  Users,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  X,
  Building,
  Edit,
  Trash2,
  Save,
  ArrowLeft,
  Upload,
  Download,
} from 'lucide-react';
import { crmService } from '../services/api';
import CRMKanban from '../components/CRM/CRMKanban';
import type { Lead, Task, Communication, CRMStats } from '../types';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700' },
  contacted: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  qualified: { bg: 'bg-purple-100', text: 'text-purple-700' },
  proposal: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  negotiation: { bg: 'bg-orange-100', text: 'text-orange-700' },
  won: { bg: 'bg-green-100', text: 'text-green-700' },
  lost: { bg: 'bg-red-100', text: 'text-red-700' },
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  website: <MessageSquare className="w-4 h-4" />,
  referral: <Users className="w-4 h-4" />,
  social: <MessageSquare className="w-4 h-4" />,
  landing_page: <Filter className="w-4 h-4" />,
  manual: <Edit className="w-4 h-4" />,
  other: <Filter className="w-4 h-4" />,
};

// Status names now use i18n - t('crm.status.xxx')

// Email templates / Plantillas de email
const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: { es: 'Bienvenida', en: 'Welcome' },
    subject: { es: '¡Bienvenido a nuestra plataforma!', en: 'Welcome to our platform!' },
    content: {
      es: 'Hola {{name}},\n\n¡Gracias por tu interés en nuestra plataforma! Nos encantaría mostrarte cómo funciona y cómo puedes empezar a ganar comisiones.\n\n¿Tienes alguna pregunta?\n\nSaludos,\n{{myName}}',
      en: 'Hi {{name}},\n\nThank you for your interest in our platform! We would love to show you how it works and how you can start earning commissions.\n\nDo you have any questions?\n\nBest regards,\n{{myName}}',
    },
  },
  {
    id: 'followup',
    name: { es: 'Seguimiento', en: 'Follow-up' },
    subject: { es: '¿Cómo va tu experiencia?', en: 'How is your experience going?' },
    content: {
      es: 'Hola {{name}},\n\nSolo quería hacer seguimiento para ver cómo va tu experiencia con nuestra plataforma.\n\n¿Hay algo en lo que pueda ayudarte?\n\nSaludos,\n{{myName}}',
      en: 'Hi {{name}},\n\nJust wanted to follow up on how your experience with our platform is going.\n\nIs there anything I can help you with?\n\nBest regards,\n{{myName}}',
    },
  },
  {
    id: 'presentation',
    name: { es: 'Presentación de producto', en: 'Product Presentation' },
    subject: { es: 'Conoce más sobre nuestro producto', en: 'Learn more about our product' },
    content: {
      es: 'Hola {{name}},\n\nTe envío información sobre nuestro producto/servicio que creo que puede interesarte.\n\n[Descripción del producto]\n\n¿Te gustaría agendar una llamada para explicar más detalles?\n\nSaludos,\n{{myName}}',
      en: "Hi {{name}},\n\nI'm sending you information about our product/service that I think might interest you.\n\n[Product description]\n\nWould you like to schedule a call to explain more details?\n\nBest regards,\n{{myName}}",
    },
  },
  {
    id: 'closing',
    name: { es: 'Cierre de venta', en: 'Closing Sale' },
    subject: { es: 'Último paso para unirte', en: 'Last step to join' },
    content: {
      es: 'Hola {{name}},\n\n¡Nos alegra que hayas decidido unirte a nuestra comunidad!\n\nPara completar tu registro, solo necesitas [acción requerida].\n\nSi tienes cualquier duda, estoy aquí para ayudarte.\n\nSaludos,\n{{myName}}',
      en: "Hi {{name}},\n\nWe are glad you decided to join our community!\n\nTo complete your registration, you just need to [required action].\n\nIf you have any questions, I'm here to help.\n\nBest regards,\n{{myName}}",
    },
  },
  {
    id: 'support',
    name: { es: 'Soporte técnico', en: 'Technical Support' },
    subject: { es: 'Estoy aquí para ayudarte', en: "I'm here to help you" },
    content: {
      es: 'Hola {{name}},\n\nRecibí tu mensaje sobre [tema]. Estoy aquí para ayudarte.\n\n[Solución o siguiente paso]\n\n¿Necesitas algo más?\n\nSaludos,\n{{myName}}',
      en: "Hi {{name}},\n\nI received your message about [topic]. I'm here to help you.\n\n[Solution or next step]\n\nDo you need anything else?\n\nBest regards,\n{{myName}}",
    },
  },
];

type Tab = 'leads' | 'kanban' | 'tasks' | 'stats';

interface LeadFormData {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  company: string;
  source: string;
  notes: string;
}

const initialFormData: LeadFormData = {
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  company: '',
  source: 'website',
  notes: '',
};

export default function CRM() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
    total: number;
  } | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadTasks, setLeadTasks] = useState<Task[]>([]);
  const [leadCommunications, setLeadCommunications] = useState<Communication[]>([]);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState<LeadFormData>(initialFormData);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [statusFilter, sourceFilter, searchQuery, dateFrom, dateTo, valueMin, valueMax]);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    }
    if (activeTab === 'tasks') {
      loadAllTasks();
    }
  }, [activeTab]);

  const loadAllTasks = async () => {
    setTasksLoading(true);
    try {
      const response = await crmService.getUpcomingTasks();
      if (response.success) {
        setAllTasks(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      const params: {
        status?: string;
        source?: string;
        search?: string;
        createdAtFrom?: string;
        createdAtTo?: string;
        valueMin?: number;
        valueMax?: number;
        limit: number;
      } = {
        limit: 50,
      };
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (searchQuery) params.search = searchQuery;
      if (dateFrom) params.createdAtFrom = dateFrom;
      if (dateTo) params.createdAtTo = dateTo;
      if (valueMin) params.valueMin = parseFloat(valueMin);
      if (valueMax) params.valueMax = parseFloat(valueMax);

      const response = await crmService.getLeads(params);
      if (response.success) {
        setLeads(response.data.leads || []);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await crmService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadLeadDetails = async (leadId: string) => {
    try {
      const [leadRes, tasksRes, commsRes] = await Promise.all([
        crmService.getLead(leadId),
        crmService.getTasks(leadId),
        crmService.getCommunications(leadId),
      ]);

      if (leadRes.success) setSelectedLead(leadRes.data);
      if (tasksRes.success) setLeadTasks(tasksRes.data || []);
      if (commsRes.success) setLeadCommunications(commsRes.data || []);
    } catch (error) {
      console.error('Failed to load lead details:', error);
    }
  };

  const handleCreateLead = async () => {
    try {
      const response = await crmService.createLead(leadFormData);
      if (response.success) {
        await loadLeads();
        setShowLeadForm(false);
        setLeadFormData(initialFormData);
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const handleUpdateLead = async () => {
    if (!editingLead) return;
    try {
      const response = await crmService.updateLead(editingLead.id, leadFormData);
      if (response.success) {
        await loadLeads();
        setEditingLead(null);
        setShowLeadForm(false);
        setLeadFormData(initialFormData);
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm(t('crm.confirmDelete'))) return;
    try {
      const response = await crmService.deleteLead(leadId);
      if (response.success) {
        await loadLeads();
        if (selectedLead?.id === leadId) {
          setSelectedLead(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await crmService.updateLead(leadId, { status: newStatus });
      if (response.success) {
        await loadLeads();
        if (selectedLead?.id === leadId) {
          loadLeadDetails(leadId);
        }
      }
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const response = await crmService.updateTask(taskId, {
        status: completed ? 'completed' : 'pending',
      });
      if (response.success && selectedLead) {
        loadLeadDetails(selectedLead.id);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Los filtros ya se aplican en el servidor
  const filteredLeads = leads;

  const statuses = [...new Set(leads.map((l) => l.status))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('crm.title')}</h1>
            <p className="text-slate-500 text-sm">{t('crm.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowLeadForm(true);
            setEditingLead(null);
            setLeadFormData(initialFormData);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          {t('crm.newLead')}
        </button>
        <button
          onClick={async () => {
            try {
              const blob = await crmService.exportLeads({
                status: statusFilter || undefined,
                source: sourceFilter || undefined,
                search: searchQuery || undefined,
              });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (error) {
              console.error('Export failed:', error);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          {t('crm.exportCSV')}
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
        >
          <Upload className="w-5 h-5" />
          {t('crm.importCSV')}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 rounded-t-xl">
        <div className="px-4">
          <div className="flex gap-8">
            {(['leads', 'kanban', 'tasks', 'stats'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t(`crm.tabs.${tab}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-xl rounded-t-none border border-t-0 border-slate-200 p-6">
        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="flex gap-6">
            {/* Leads List */}
            <div className="flex-1">
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('crm.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">{t('crm.allStatuses')}</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {t(`crm.status.${status}`, { defaultValue: status })}
                    </option>
                  ))}
                </select>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">{t('crm.allSources')}</option>
                  <option value="website">{t('crm.sourceWebsite')}</option>
                  <option value="referral">{t('crm.sourceReferral')}</option>
                  <option value="social">{t('crm.sourceSocial')}</option>
                  <option value="landing_page">{t('crm.sourceLandingPage')}</option>
                  <option value="manual">{t('crm.sourceManual')}</option>
                  <option value="other">{t('crm.sourceOther')}</option>
                </select>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-4 py-2.5 border rounded-xl transition-colors ${
                    showAdvancedFilters
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-5 h-5 inline mr-1" />
                  {t('crm.advancedFilters')}
                </button>
              </div>

              {/* Filtros Avanzados */}
              {showAdvancedFilters && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        {t('crm.dateFrom')}
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        {t('crm.dateTo')}
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        {t('crm.valueMin')}
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={valueMin}
                        onChange={(e) => setValueMin(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        {t('crm.valueMax')}
                      </label>
                      <input
                        type="number"
                        placeholder="1000"
                        value={valueMax}
                        onChange={(e) => setValueMax(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                        setValueMin('');
                        setValueMax('');
                      }}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      {t('crm.clearFilters')}
                    </button>
                  </div>
                </div>
              )}

              {/* Leads Grid */}
              {leadsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">{t('crm.noLeads')}</h3>
                  <p className="text-slate-500 mb-4">
                    {searchQuery || statusFilter ? t('crm.noResults') : t('crm.addFirst')}
                  </p>
                  <button
                    onClick={() => setShowLeadForm(true)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    {t('crm.addLead')}
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => loadLeadDetails(lead.id)}
                      className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                            {lead.contactName[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{lead.contactName}</h3>
                            <p className="text-sm text-slate-500">{lead.contactEmail}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[lead.status]?.bg || 'bg-slate-100'
                          } ${STATUS_COLORS[lead.status]?.text || 'text-slate-700'}`}
                        >
                          {t(`crm.status.${lead.status}`, { defaultValue: lead.status })}
                        </span>
                      </div>
                      {lead.company && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                          <Building className="w-4 h-4" />
                          {lead.company}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 capitalize flex items-center gap-1">
                          {SOURCE_ICONS[lead.source]} {lead.source.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lead Details Panel */}
            {selectedLead && (
              <div className="w-96 bg-slate-50 rounded-xl p-6 h-fit sticky top-6 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">{t('crm.leadDetails')}</h2>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-slate-400 hover:text-slate-600"
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
                      <h3 className="font-semibold text-slate-900">{selectedLead.contactName}</h3>
                      <select
                        value={selectedLead.status}
                        onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                        className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[selectedLead.status]?.bg || 'bg-slate-100'
                        } ${STATUS_COLORS[selectedLead.status]?.text || 'text-slate-700'}`}
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
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{selectedLead.contactEmail}</span>
                    </div>
                    {selectedLead.contactPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{selectedLead.contactPhone}</span>
                      </div>
                    )}
                    {selectedLead.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{selectedLead.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {t('crm.tasksLabel')} ({leadTasks.length})
                  </h4>
                  {leadTasks.length === 0 ? (
                    <p className="text-sm text-slate-500">{t('crm.noTasks')}</p>
                  ) : (
                    <div className="space-y-2">
                      {leadTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-2 bg-white rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={(e) => handleTaskComplete(task.id, e.target.checked)}
                            className="rounded text-emerald-500"
                          />
                          <span
                            className={`flex-1 text-sm ${
                              task.status === 'completed' ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Notes Section */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-3">{t('crm.quickNotes')}</h3>
                  <div className="space-y-2 mb-3">
                    {leadCommunications
                      .filter((c) => c.type === 'note')
                      .slice(0, 3)
                      .map((note) => (
                        <div
                          key={note.id}
                          className="text-sm bg-yellow-50 p-2 rounded-lg border border-yellow-100"
                        >
                          <p className="text-slate-700">{note.content}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id={`quick-note-${selectedLead.id}`}
                      placeholder={t('crm.addQuickNote')}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                            const commsRes = await crmService.getCommunications(selectedLead.id);
                            if (commsRes.success) setLeadCommunications(commsRes.data || []);
                            input.value = '';
                          } catch (error) {
                            console.error('Failed to add note:', error);
                          }
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{t('crm.quickNoteHint')}</p>
                </div>

                {/* Email Templates Section */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-900">{t('crm.emailTemplates')}</h3>
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
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
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
                              const content =
                                template.content[i18n.language as 'es' | 'en'] ||
                                template.content.es;
                              const filledContent = content
                                .replace(/{{name}}/g, selectedLead.contactName)
                                .replace(/{{myName}}/g, 'Tu Nombre');
                              // Open email client or copy to clipboard
                              const mailto = `mailto:${selectedLead.contactEmail}?subject=${encodeURIComponent(template.subject[i18n.language as 'es' | 'en'] || template.subject.es)}&body=${encodeURIComponent(filledContent)}`;
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
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-white flex items-center justify-center gap-2"
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
        {activeTab === 'kanban' && <CRMKanban />}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div>
            {tasksLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
              </div>
            ) : allTasks.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {t('crm.allTasksTitle')}
                </h3>
                <p className="text-slate-500">{t('crm.allTasksDescription')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={async () => {
                        try {
                          await crmService.updateTask(task.id, {
                            status: task.status === 'completed' ? 'pending' : 'completed',
                          });
                          loadAllTasks();
                        } catch (error) {
                          console.error('Failed to update task:', error);
                        }
                      }}
                      className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${
                          task.status === 'completed'
                            ? 'text-slate-400 line-through'
                            : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                      )}
                    </div>
                    {task.dueDate && (
                      <div className="text-sm text-slate-500">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{t('crm.statsTotal')}</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalLeads}</p>
                </div>
                <Users className="w-12 h-12 text-slate-200" />
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600">{t('crm.statsWon')}</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.wonLeads}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-emerald-200" />
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600">{t('crm.statsInProgress')}</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.inProgress}</p>
                </div>
                <Clock className="w-12 h-12 text-amber-200" />
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{t('crm.statsConversionRate')}</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalLeads > 0
                      ? Math.round((stats.wonLeads / stats.totalLeads) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <AlertCircle className="w-12 h-12 text-slate-700" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingLead ? t('crm.modalEditLead') : t('crm.modalNewLead')}
              </h2>
              <button
                onClick={() => {
                  setShowLeadForm(false);
                  setEditingLead(null);
                  setLeadFormData(initialFormData);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('crm.contactName')} *
                </label>
                <input
                  type="text"
                  value={leadFormData.contactName}
                  onChange={(e) =>
                    setLeadFormData({ ...leadFormData, contactName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('crm.placeholderName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('crm.contactEmail')} *
                </label>
                <input
                  type="email"
                  value={leadFormData.contactEmail}
                  onChange={(e) =>
                    setLeadFormData({ ...leadFormData, contactEmail: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('crm.placeholderEmail')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('crm.phone')}
                </label>
                <input
                  type="tel"
                  value={leadFormData.contactPhone}
                  onChange={(e) =>
                    setLeadFormData({ ...leadFormData, contactPhone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('crm.placeholderPhone')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('crm.company')}
                </label>
                <input
                  type="text"
                  value={leadFormData.company}
                  onChange={(e) => setLeadFormData({ ...leadFormData, company: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('crm.placeholderCompany')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('crm.source')}
                </label>
                <select
                  value={leadFormData.source}
                  onChange={(e) => setLeadFormData({ ...leadFormData, source: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="website">{t('crm.sourceWebsite')}</option>
                  <option value="referral">{t('crm.sourceReferral')}</option>
                  <option value="social">{t('crm.sourceSocial')}</option>
                  <option value="landing_page">{t('crm.sourceLandingPage')}</option>
                  <option value="manual">{t('crm.sourceManual')}</option>
                  <option value="other">{t('crm.sourceOther')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('crm.notes')}
                </label>
                <textarea
                  value={leadFormData.notes}
                  onChange={(e) => setLeadFormData({ ...leadFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('crm.placeholderNotes')}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowLeadForm(false);
                  setEditingLead(null);
                  setLeadFormData(initialFormData);
                }}
                className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                {t('crm.cancel')}
              </button>
              <button
                onClick={editingLead ? handleUpdateLead : handleCreateLead}
                disabled={!leadFormData.contactName || !leadFormData.contactEmail}
                className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                <Save className="w-4 h-4" />
                {editingLead ? t('crm.saveChanges') : t('crm.createLead')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{t('crm.importCSV')}</h2>
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
                      <p className="font-medium text-slate-700 mb-2">{t('crm.errors')}:</p>
                      <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-lg p-2 text-sm">
                        {importResult.errors.map((err, i) => (
                          <p key={i} className="text-red-600">
                            {err}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportResult(null);
                      loadLeads();
                    }}
                    className="w-full px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
                  >
                    {t('crm.close')}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-slate-600 mb-4">{t('crm.importInstructions')}</p>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center mb-4">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const csv = event.target?.result as string;
                          setImporting(true);
                          try {
                            const result = await crmService.importLeads(csv);
                            setImportResult(result.data);
                          } catch (error) {
                            console.error('Import failed:', error);
                            setImportResult({ imported: 0, errors: ['Import failed'], total: 0 });
                          } finally {
                            setImporting(false);
                          }
                        };
                        reader.readAsText(file);
                      }}
                      className="hidden"
                      id="csv-upload"
                    />
                    {importing ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                        <span className="ml-2 text-slate-600">{t('crm.importing')}</span>
                      </div>
                    ) : (
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600">{t('crm.selectFile')}</p>
                        <p className="text-sm text-slate-400">CSV</p>
                      </label>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportResult(null);
                      }}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
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
