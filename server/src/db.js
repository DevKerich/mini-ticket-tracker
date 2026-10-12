import pg from 'pg';

// Postgres returns BIGINT as a string to avoid precision loss. Ticket ids will
// never approach 2^53, so parse them as plain numbers for a nicer JSON shape.
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number(value));

export function createPool(connectionString) {
  return new pg.Pool({ connectionString, max: 10 });
}
