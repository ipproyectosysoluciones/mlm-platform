/**
 * LeadCard - Lead card component for list view
 * Tarjeta de lead para vista de lista
 *
 * @module components/crm/LeadCard
 */
import { Building, MessageSquare, Users, Filter, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lead } from '../../types';

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

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  const { t } = useTranslation();

  return (
    <div
      onClick={onClick}
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
        <span className="text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
