import type { Task } from '@/lib/db/schema';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          aria-label={`Marquer ${task.title} comme ${task.completed ? 'non terminé' : 'terminé'}`}
          className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className={`text-gray-800 ${task.completed ? 'line-through opacity-60' : ''}`}>
          {task.title}
        </span>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        aria-label={`Supprimer ${task.title}`}
        className="rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Supprimer
      </button>
    </li>
  );
}
