import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type {
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import { Phone, Mail, Calendar, DollarSign, Plus, Eye, Edit } from 'lucide-react';
import { crmService } from '../../services/crmService';
import type { Lead, LeadStatus, LeadStats } from '../../services/crmService';

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'Nuevo', color: 'bg-gray-100 border-gray-300' },
  contacted: { label: 'Contactado', color: 'bg-blue-50 border-blue-300' },
  qualified: { label: 'Calificado', color: 'bg-yellow-50 border-yellow-300' },
  proposal: { label: 'Propuesta', color: 'bg-orange-50 border-orange-300' },
  negotiation: { label: 'Negociación', color: 'bg-purple-50 border-purple-300' },
  won: { label: 'Ganado', color: 'bg-green-50 border-green-300' },
  lost: { label: 'Perdido', color: 'bg-red-50 border-red-300' },
};

const STATUS_ORDER: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
];

interface LeadCardProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
}

function LeadCard({ lead, onView, onEdit }: LeadCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 mb-2 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm truncate">{lead.contactName}</h4>
        <div className="flex gap-1">
          <button onClick={() => onView(lead)} className="text-gray-400 hover:text-indigo-600">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => onEdit(lead)} className="text-gray-400 hover:text-indigo-600">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      {lead.company && <p className="text-xs text-gray-500 mb-2">{lead.company}</p>}

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Mail className="w-3 h-3" />
          <span className="truncate">{lead.contactEmail}</span>
        </div>
        {lead.contactPhone && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
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

export default function CRMKanban() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [, setShowNewLead] = useState(false);

  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    setIsLoading(true);
    try {
      const [leadsData, statsData] = await Promise.all([
        crmService.getLeads({ limit: 100 }),
        crmService.getStats(),
      ]);
      setLeads(leadsData.leads);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load CRM data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId as LeadStatus;

    try {
      await crmService.updateLeadStatus(leadId, newStatus);
      setLeads(leads.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead)));
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Header */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Leads</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Valor Total</p>
            <p className="text-2xl font-bold text-green-600">${stats.totalValue}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Tasa Conversión</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.conversionRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Won / Lost</p>
            <p className="text-2xl font-bold">
              <span className="text-green-600">{stats.byStatus.won}</span>
              <span className="text-gray-400"> / </span>
              <span className="text-red-600">{stats.byStatus.lost}</span>
            </p>
          </div>
        </div>
      )}

      {/* Add Lead Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowNewLead(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Lead
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => {
            const statusLeads = getLeadsByStatus(status);
            const config = STATUS_CONFIG[status];

            return (
              <div key={status} className="flex-shrink-0 w-72">
                <div className={`rounded-t-lg p-3 border-t border-l border-r ${config.color}`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">{config.label}</h3>
                    <span className="bg-white px-2 py-0.5 rounded-full text-sm text-gray-600">
                      {statusLeads.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={status}>
                  {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] bg-gray-50 p-2 rounded-b-lg border-x border-b ${
                        snapshot.isDraggingOver ? 'bg-indigo-50' : ''
                      }`}
                    >
                      {statusLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'opacity-75' : ''}
                            >
                              <LeadCard
                                lead={lead}
                                onView={setSelectedLead}
                                onEdit={setSelectedLead}
                              />
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
          })}
        </div>
      </DragDropContext>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedLead.contactName}</h2>
                  {selectedLead.company && <p className="text-gray-500">{selectedLead.company}</p>}
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedLead.contactEmail}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Teléfono</label>
                  <p className="font-medium">{selectedLead.contactPhone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Estado</label>
                  <p className="font-medium">{STATUS_CONFIG[selectedLead.status].label}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Valor</label>
                  <p className="font-medium text-green-600">${selectedLead.value}</p>
                </div>
              </div>

              {selectedLead.notes && (
                <div className="mb-6">
                  <label className="text-sm text-gray-500">Notas</label>
                  <p className="mt-1 text-gray-700">{selectedLead.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
                <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                  Agregar Tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
