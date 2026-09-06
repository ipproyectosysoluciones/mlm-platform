/**
 * TaskCard - Task card component
 * Tarjeta de tarea para listado
 *
 * @module components/crm/TaskCard
 */
import { crmService } from '../../services/api';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onComplete?: () => void;
}

export default function TaskCard({ task, onComplete }: TaskCardProps) {
  const handleStatusToggle = async () => {
    try {
      await crmService.updateTask(task.id, {
        status: task.status === 'completed' ? 'pending' : 'completed',
      });
      onComplete?.();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-[var(--color-secondary)] rounded-xl hover:bg-[var(--color-secondary)] transition-colors">
      <input
        type="checkbox"
        checked={task.status === 'completed'}
        onChange={handleStatusToggle}
        className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500"
      />
      <div className="flex-1">
        <h4
          className={`font-medium ${
            task.status === 'completed' ? 'text-[var(--color-foreground-muted)] line-through' : 'text-[var(--color-foreground)]'
          }`}
        >
          {task.title}
        </h4>
        {task.description && <p className="text-sm text-[var(--color-foreground-muted)] mt-1">{task.description}</p>}
      </div>
      {task.dueDate && (
        <div className="text-sm text-[var(--color-foreground-muted)]">{new Date(task.dueDate).toLocaleDateString()}</div>
      )}
    </div>
  );
}
