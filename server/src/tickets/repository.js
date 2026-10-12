// All SQL for tickets lives here so routes stay focused on HTTP concerns.
// Every query is parameterised; column names in UPDATE come from a fixed
// allow-list, never from user input.

const COLUMNS = 'id, title, description, status, priority, created_at';
const UPDATABLE = ['status', 'priority'];

export function createTicketRepository(pool) {
  return {
    async create({ title, description, priority }) {
      const { rows } = await pool.query(
        `INSERT INTO tickets (title, description, priority)
         VALUES ($1, $2, $3)
         RETURNING ${COLUMNS}`,
        [title, description, priority],
      );
      return rows[0];
    },

    async list({ status, page, limit }) {
      const where = status ? 'WHERE status = $1' : '';
      const params = status ? [status] : [];
      const offset = (page - 1) * limit;

      const [items, count] = await Promise.all([
        pool.query(
          `SELECT ${COLUMNS} FROM tickets ${where}
           ORDER BY created_at DESC, id DESC
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, limit, offset],
        ),
        pool.query(`SELECT count(*)::int AS total FROM tickets ${where}`, params),
      ]);

      return { items: items.rows, total: count.rows[0].total };
    },

    /** Returns the updated ticket, or null if no ticket has that id. */
    async update(id, changes) {
      const fields = UPDATABLE.filter((f) => changes[f] !== undefined);
      const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
      const { rows } = await pool.query(
        `UPDATE tickets SET ${sets} WHERE id = $1 RETURNING ${COLUMNS}`,
        [id, ...fields.map((f) => changes[f])],
      );
      return rows[0] ?? null;
    },

    async countByStatus() {
      const { rows } = await pool.query(
        'SELECT status, count(*)::int AS count FROM tickets GROUP BY status',
      );
      return rows;
    },
  };
}
