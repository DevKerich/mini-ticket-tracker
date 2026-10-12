import express from 'express';
import path from 'node:path';
import { NotFoundError, errorHandler } from './errors.js';
import { createTicketRepository } from './tickets/repository.js';
import { ticketsRouter } from './tickets/routes.js';

/**
 * Builds the Express app around an injected pg pool, so tests can point it at
 * a separate database without touching globals.
 */
export function createApp({ pool, clientDist = null }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (req, res, next) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch (err) {
      next(err);
    }
  });

  app.use('/tickets', ticketsRouter(createTicketRepository(pool)));

  // In the Docker image the API also serves the built UI, so everything runs
  // on one origin and no CORS configuration is needed.
  if (clientDist) {
    app.use(express.static(clientDist));
    app.get('/', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use((req, res, next) => next(new NotFoundError(`Route ${req.method} ${req.path} not found`)));
  app.use(errorHandler);
  return app;
}
