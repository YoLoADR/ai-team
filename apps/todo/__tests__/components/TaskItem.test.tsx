import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { TaskItem } from '@/components/TaskItem';
import type { Task } from '@/lib/db/schema';

const task: Task = {
  id: 1,
  title: 'Apprendre TDD',
  description: null,
  completed: false,
  priority: 'medium',
  dueDate: null,
  category: 'general',
  createdAt: '2026-08-03T10:00:00Z',
  updatedAt: '2026-08-03T10:00:00Z',
};

describe('TaskItem', () => {
  test('affiche le titre du todo', () => {
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Apprendre TDD')).toBeInTheDocument();
  });

  test('appelle onToggle avec le bon id', () => {
    const onToggle = vi.fn();
    render(<TaskItem task={task} onToggle={onToggle} onDelete={vi.fn()} />);

    screen.getByRole('checkbox').click();
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  test('appelle onDelete avec le bon id', () => {
    const onDelete = vi.fn();
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={onDelete} />);

    screen.getByRole('button', { name: /supprimer/i }).click();
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  test('barre le texte quand le todo est complété', () => {
    const completedTask = { ...task, completed: true };
    render(<TaskItem task={completedTask} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Apprendre TDD')).toHaveClass('line-through');
  });
});
