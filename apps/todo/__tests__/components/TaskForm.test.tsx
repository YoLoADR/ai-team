import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { TaskForm } from '@/components/TaskForm';

describe('TaskForm', () => {
  test('affiche le champ et le bouton de soumission', () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText(/nouvelle tâche/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
  });

  test('appelle onSubmit avec le titre saisi', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText(/nouvelle tâche/i);
    const button = screen.getByRole('button', { name: /ajouter/i });

    input.focus();
    input.setAttribute('value', 'Apprendre TDD');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    button.click();

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Apprendre TDD' });
  });

  test('ne soumet pas si le titre est vide', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    screen.getByRole('button', { name: /ajouter/i }).click();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('réinitialise le champ après soumission', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText(/nouvelle tâche/i);
    input.focus();
    input.setAttribute('value', 'Faire du sport');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    screen.getByRole('button', { name: /ajouter/i }).click();

    expect(input).toHaveValue('');
  });
});
