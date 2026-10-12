export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/tickets',
  // When set, the API also serves the built React app from this directory.
  clientDist: process.env.CLIENT_DIST || null,
};
