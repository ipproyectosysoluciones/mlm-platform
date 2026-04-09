/**
 * LeadModal - Lead create/edit modal form
 * Modal de formulario para crear/editar leads
 *
 * @module components/crm/LeadModal
 */
import { X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lead } from '../../types';

export interface LeadFormData {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  company: string;
  source: string;
  notes: string;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: LeadFormData;
  onFormDataChange: (data: LeadFormData) => void;
  editingLead: Lead | null;
}

export default function LeadModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormDataChange,
  editingLead,
}: LeadModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingLead ? t('crm.modalEditLead') : t('crm.modalNewLead')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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
              value={formData.contactName}
              onChange={(e) => onFormDataChange({ ...formData, contactName: e.target.value })}
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
              value={formData.contactEmail}
              onChange={(e) => onFormDataChange({ ...formData, contactEmail: e.target.value })}
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
              value={formData.contactPhone}
              onChange={(e) => onFormDataChange({ ...formData, contactPhone: e.target.value })}
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
              value={formData.company}
              onChange={(e) => onFormDataChange({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={t('crm.placeholderCompany')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('crm.source')}
            </label>
            <select
              value={formData.source}
              onChange={(e) => onFormDataChange({ ...formData, source: e.target.value })}
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
              value={formData.notes}
              onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={t('crm.placeholderNotes')}
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            {t('crm.cancel')}
          </button>
          <button
            onClick={onSubmit}
            disabled={!formData.contactName || !formData.contactEmail}
            className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <Save className="w-4 h-4" />
            {editingLead ? t('crm.saveChanges') : t('crm.createLead')}
          </button>
        </div>
      </div>
    </div>
  );
}
