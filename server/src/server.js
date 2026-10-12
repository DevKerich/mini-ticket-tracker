import { createApp } from './app.js';
import { config } from './config.js';
import { createPool } from './db.js';
import { migrate } from './migrate.js';

const pool = createPool(config.databaseUrl);

await migrate(pool);

const app = createApp({ pool, clientDist: config.clientDist });
const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

// Let in-flight requests finish and close DB connections on shutdown.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}
