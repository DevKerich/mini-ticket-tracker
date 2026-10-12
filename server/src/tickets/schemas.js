import { z } from 'zod';

export const STATUSES = ['open', 'in_progress', 'closed'];
export const PRIORITIES = ['low', 'medium', 'high'];

export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 20;

// New tickets always start as "open"; status is not accepted on create.
// .strict() rejects unknown fields so typos (e.g. "priorty") fail loudly
// instead of being silently ignored.
export const createTicketSchema = z
  .object({
    title: z.string().trim().min(1, 'title is required').max(200),
    description: z
      .string()
      .trim()
      .max(5000)
      .nullish()
      .transform((v) => (v ? v : null)), // treat "" as "no description"
    priority: z.enum(PRIORITIES).default('medium'),
  })
  .strict();

export const updateTicketSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
  })
  .strict()
  .refine((body) => body.status !== undefined || body.priority !== undefined, {
    message: 'provide at least one of: status, priority',
  });

// Numbers beyond the safe-integer range would otherwise pass validation and
// fail inside Postgres (bigint / OFFSET overflow) as a 500.
const safeInt = () => z.coerce.number().int().max(Number.MAX_SAFE_INTEGER);

export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  page: safeInt().min(1).default(1),
  limit: safeInt().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

export const idParamsSchema = z.object({
  id: safeInt().positive(),
});
