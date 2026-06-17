/**
 * KanbanBoard - CRM Kanban Board with drag-and-drop columns
 * Tablero Kanban para gestión de leads con arrastrar y soltar
 *
 * @module components/crm/KanbanBoard
 */
import { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { useCRMKanban } from '@/hooks/useCRMKanban';
import { KanbanColumn } from './KanbanColumn';
import type { Lead, LeadStatus } from '@/services/crmService';
import { LEAD_STATUSES } from '@/features/crm/constants';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'Nuevo', color: 'bg-gray-100 border-gray-300' },
  contacted: { label: 'Contactado', color: 'bg-blue-50 border-blue-300' },
  qualified: { label: 'Calificado', color: 'bg-yellow-50 border-yellow-300' },
  proposal: { label: 'Propuesta', color: 'bg-orange-50 border-orange-300' },
  negotiation: { label: 'Negociación', color: 'bg-purple-50 border-purple-300' },
  won: { label: 'Ganado', color: 'bg-green-50 border-green-300' },
  lost: { label: 'Perdido', color: 'bg-red-50 border-red-300' },
};

export function KanbanBoard() {
  const { stats, isLoading, getLeadsByStatus, handleDragEnd: kanbanDragEnd } = useCRMKanban();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    type: 'follow_up',
    description: '',
  });
  const [isCreatingTask] = useState(false);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    await kanbanDragEnd(result.draggableId, result.destination.droppableId as LeadStatus);
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
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo Lead
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={getLeadsByStatus(status)}
              statusConfig={STATUS_CONFIG[status]}
              onViewLead={setSelectedLead}
              onEditLead={setSelectedLead}
            />
          ))}
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
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  Agregar Tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && selectedLead && (
        <KanbanTaskForm
          lead={selectedLead}
          taskFormData={taskFormData}
          setTaskFormData={setTaskFormData}
          isCreatingTask={isCreatingTask}
          onClose={() => {
            setShowTaskForm(false);
            setTaskFormData({ title: '', type: 'follow_up', description: '' });
          }}
        />
      )}
    </div>
  );
}

interface KanbanTaskFormProps {
  lead: Lead;
  taskFormData: { title: string; type: string; description: string };
  setTaskFormData: (data: { title: string; type: string; description: string }) => void;
  isCreatingTask: boolean;
  onClose: () => void;
}

function KanbanTaskForm({
  lead,
  taskFormData,
  setTaskFormData,
  isCreatingTask,
  onClose,
}: KanbanTaskFormProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">Nueva Tarea — {lead.contactName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={taskFormData.title}
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Título de la tarea"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={taskFormData.type}
              onChange={(e) => setTaskFormData({ ...taskFormData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="call">Llamada</option>
              <option value="email">Email</option>
              <option value="meeting">Reunión</option>
              <option value="follow_up">Seguimiento</option>
              <option value="note">Nota</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={taskFormData.description}
              onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descripción de la tarea"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            disabled={!taskFormData.title.trim() || isCreatingTask}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingTask ? 'Creando...' : 'Crear Tarea'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default KanbanBoard;
