/**
 * TaskModal - Task create modal form
 * Modal de formulario para crear tareas
 *
 * @module components/crm/TaskModal
 */
interface TaskFormData {
  title: string;
  type: string;
  description: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: TaskFormData;
  onFormDataChange: (data: TaskFormData) => void;
  isCreating: boolean;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormDataChange,
  isCreating,
}: TaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nueva Tarea</h2>
            <button
              onClick={() => {
                onClose();
                onFormDataChange({ title: '', type: 'follow_up', description: '' });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Título de la tarea"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => onFormDataChange({ ...formData, type: e.target.value })}
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
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descripción de la tarea"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => {
                onClose();
                onFormDataChange({ title: '', type: 'follow_up', description: '' });
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={!formData.title.trim() || isCreating}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
