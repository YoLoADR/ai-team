import { z } from 'zod';

const trimmedTitle = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1).max(255));

export const createTaskSchema = z.object({
  title: trimmedTitle,
});

export const updateTaskSchema = z.object({
  title: trimmedTitle.optional(),
  completed: z.boolean().optional(),
});
