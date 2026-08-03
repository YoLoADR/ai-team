import { z } from 'zod';

export const taskInsertSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().max(2000).optional().default(''),
  completed: z.boolean().optional().default(false),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  dueDate: z.string().optional(),
  category: z.string().max(50).optional().default('general'),
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
  category: z.string().max(50).optional(),
});

export type TaskInsert = z.infer<typeof taskInsertSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;