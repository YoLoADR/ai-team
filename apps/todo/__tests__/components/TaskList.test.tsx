import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { TaskList } from '@/components/TaskList';
import type { Task } from '@/lib/db/schema';

const tasks: Task[] = [
  {
    id: 1,
    title: 'Apprendre TDD',
    description: null,
    completed: false,
    priority: 'medium',
    dueDate: null,
    category: 'general',
    createdAt: '2026-08-03T10:00:00Z',
    updatedAt: '2026-08-03T10:00:00Z',
  },
  {
    id: 2,
    title: 'Boire du café',
    description: null,
    completed: true,
    priority: 'low',
    dueDate: null,
    category: 'general',
    createdAt: '2026-08-03T10:00:00Z',
    updatedAt: '2026-08-03T10:00:00Z',
  },
];

describe('TaskList', () => {
  test('affiche un message si la liste est vide', () => {
    render(<TaskList tasks={[]} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/aucune tâche/i)).toBeInTheDocument();
  });

  test('rend tous les todos passés', () => {
    render(<TaskList tasks={tasks} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Apprendre TDD')).toBeInTheDocument();
    expect(screen.getByText('Boire du café')).toBeInTheDocument();
  });

  test('propage les événements toggle et delete', async () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    render(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalledWith(1);

    const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
    await userEvent.click(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledWith(2);
  });
});
