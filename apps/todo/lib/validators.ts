import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
  completed: z.boolean().optional().default(false),
});

export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less')
    .optional(),
  completed: z.boolean().optional(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

export function validateCreateTodo(data: unknown): CreateTodoInput {
  return createTodoSchema.parse(data);
}

export function validateUpdateTodo(data: unknown): UpdateTodoInput {
  return updateTodoSchema.parse(data);
}
