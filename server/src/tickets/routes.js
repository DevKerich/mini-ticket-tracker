import { Router } from 'express';
import { NotFoundError, validate } from '../errors.js';
import {
  STATUSES,
  createTicketSchema,
  idParamsSchema,
  listQuerySchema,
  updateTicketSchema,
} from './schemas.js';

// Express 4 doesn't forward rejected promises to the error handler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function ticketsRouter(repo) {
  const router = Router();

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const input = validate(createTicketSchema, req.body ?? {});
      const ticket = await repo.create(input);
      res.status(201).location(`/tickets/${ticket.id}`).json(ticket);
    }),
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { status, page, limit } = validate(listQuerySchema, req.query);
      const { items, total } = await repo.list({ status, page, limit });
      res.json({
        data: items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }),
  );

  // Registered before any /:id GET route would be, so "stats" is never
  // mistaken for an id.
  router.get(
    '/stats',
    asyncHandler(async (req, res) => {
      const rows = await repo.countByStatus();
      // Always report every status, including those with zero tickets, so
      // clients get a stable shape.
      const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
      for (const { status, count } of rows) counts[status] = count;
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      res.json({ ...counts, total });
    }),
  );

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const { id } = validate(idParamsSchema, req.params);
      const changes = validate(updateTicketSchema, req.body ?? {});
      const ticket = await repo.update(id, changes);
      if (!ticket) throw new NotFoundError(`Ticket ${id} not found`);
      res.json(ticket);
    }),
  );

  return router;
}
