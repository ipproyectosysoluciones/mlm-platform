/**
 * LeadCard - Individual lead card for the list view
 * Tarjeta de lead para vista de lista
 *
 * @module components/crm/LeadCard
 */
import { Building, MessageSquare, Users, Filter, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lead } from '@/types';
import { STATUS_COLORS } from '@/features/crm/constants';

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

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const { t } = useTranslation();

  return (
    <div
      onClick={onClick}
      className="bg-[var(--color-secondary)] rounded-xl p-4 hover:bg-[var(--color-secondary)] transition-colors cursor-pointer border border-[var(--color-border-subtle)]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
            {lead.contactName[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-foreground)]">{lead.contactName}</h3>
            <p className="text-sm text-[var(--color-foreground-muted)]">{lead.contactEmail}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            STATUS_COLORS[lead.status]?.bg || 'bg-[var(--color-secondary)]'
          } ${STATUS_COLORS[lead.status]?.text || 'text-[var(--color-foreground)]'}`}
        >
          {t(`crm.status.${lead.status}`, { defaultValue: lead.status })}
        </span>
      </div>
      {lead.company && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)] mb-2">
          <Building className="w-4 h-4" />
          {lead.company}
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--color-foreground-muted)] capitalize flex items-center gap-1">
          {SOURCE_ICONS[lead.source]} {lead.source.replace('_', ' ')}
        </span>
        <span className="text-[var(--color-foreground-muted)]">{new Date(lead.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export default LeadCard;
