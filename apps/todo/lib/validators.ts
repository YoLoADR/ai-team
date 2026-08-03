import { z } from 'zod';

const titleValidator = z.string().superRefine((value, ctx) => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'INVALID_TITLE', fatal: true });
    return;
  }

  if (trimmed.length > 200) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      type: 'string',
      maximum: 200,
      inclusive: true,
      message: 'TITLE_TOO_LONG',
    });
  }
});

export const createTodoSchema = z.object({
  title: titleValidator,
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = z
  .object({
    title: titleValidator.optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: 'NO_FIELDS_TO_UPDATE',
  });

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
