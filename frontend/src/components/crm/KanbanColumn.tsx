/**
 * KanbanColumn - Single kanban column with droppable area
 * Columna individual de kanban con área soltable
 *
 * @module components/crm/KanbanColumn
 */
import { Phone, Mail, Calendar, DollarSign, Eye, Edit } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type {
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import type { Lead, LeadStatus } from '@/services/crmService';

interface StatusConfig {
  label: string;
  color: string;
}

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  statusConfig: StatusConfig;
  onViewLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
}

function KanbanLeadCard({
  lead,
  onView,
  onEdit,
}: {
  lead: Lead;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
}) {
  return (
    <div className="bg-[var(--color-card)] rounded-lg shadow-sm border p-3 mb-2 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-[var(--color-foreground)] text-sm truncate">{lead.contactName}</h4>
        <div className="flex gap-1">
          <button onClick={() => onView(lead)} className="text-[var(--color-foreground-muted)] hover:text-indigo-600">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => onEdit(lead)} className="text-[var(--color-foreground-muted)] hover:text-indigo-600">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      {lead.company && <p className="text-xs text-[var(--color-foreground-muted)] mb-2">{lead.company}</p>}

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-[var(--color-foreground-muted)]">
          <Mail className="w-3 h-3" />
          <span className="truncate">{lead.contactEmail}</span>
        </div>
        {lead.contactPhone && (
          <div className="flex items-center gap-1 text-xs text-[var(--color-foreground-muted)]">
            <Phone className="w-3 h-3" />
            <span>{lead.contactPhone}</span>
          </div>
        )}
        {lead.value > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <DollarSign className="w-3 h-3" />
            <span>${lead.value}</span>
          </div>
        )}
      </div>

      {lead.nextFollowUpAt && (
        <div className="mt-2 pt-2 border-t flex items-center gap-1 text-xs text-orange-600">
          <Calendar className="w-3 h-3" />
          <span>Seguimiento pendiente</span>
        </div>
      )}
    </div>
  );
}

export function KanbanColumn({
  status,
  leads,
  statusConfig,
  onViewLead,
  onEditLead,
}: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-72">
      <div className={`rounded-t-lg p-3 border-t border-l border-r ${statusConfig.color}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-[var(--color-foreground)]">{statusConfig.label}</h3>
          <span className="bg-[var(--color-card)] px-2 py-0.5 rounded-full text-sm text-[var(--color-foreground-muted)]">
            {leads.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] bg-[var(--color-secondary)] p-2 rounded-b-lg border-x border-b ${
              snapshot.isDraggingOver ? 'bg-indigo-50' : ''
            }`}
          >
            {leads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{ ...provided.draggableProps.style } as React.CSSProperties}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? 'opacity-75' : ''}
                  >
                    <KanbanLeadCard lead={lead} onView={onViewLead} onEdit={onEditLead} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default KanbanColumn;
