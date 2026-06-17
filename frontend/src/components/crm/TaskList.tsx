/**
 * TaskList - Task list/management component
 * Componente de lista/gestión de tareas
 *
 * @module components/crm/TaskList
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { useCRMTasks } from '@/hooks/useCRMTasks';
import TaskCard from './TaskCard';

export function TaskList() {
  const { t } = useTranslation();
  const { allTasks, tasksLoading, loadAllTasks } = useCRMTasks();

  useEffect(() => {
    loadAllTasks();
  }, [loadAllTasks]);

  return (
    <div>
      {tasksLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : allTasks.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t('crm.allTasksTitle')}</h3>
          <p className="text-slate-500">{t('crm.allTasksDescription')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allTasks.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={loadAllTasks} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskList;
