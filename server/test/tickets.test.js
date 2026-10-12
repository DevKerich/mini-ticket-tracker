// Integration tests: real Express app + real Postgres (a separate test DB).
// Each test starts from an empty tickets table.
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPool } from '../src/db.js';
import { migrate } from '../src/migrate.js';

const pool = createPool(
  process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/tickets_test',
);
const app = createApp({ pool });

before(() => migrate(pool));
beforeEach(() => pool.query('TRUNCATE tickets RESTART IDENTITY'));
after(() => pool.end());

const createTicket = (body) => request(app).post('/tickets').send(body);

describe('POST /tickets', () => {
  test('creates a ticket with defaults and returns 201', async () => {
    const res = await createTicket({ title: 'Login page broken', description: 'Spinner forever' });

    assert.equal(res.status, 201);
    assert.equal(res.headers.location, `/tickets/${res.body.id}`);
    assert.equal(res.body.title, 'Login page broken');
    assert.equal(res.body.description, 'Spinner forever');
    assert.equal(res.body.status, 'open');
    assert.equal(res.body.priority, 'medium');
    assert.ok(!Number.isNaN(Date.parse(res.body.created_at)));

    const { rows } = await pool.query('SELECT count(*)::int AS n FROM tickets');
    assert.equal(rows[0].n, 1, 'ticket is persisted');
  });

  test('rejects missing/blank title, bad enums and unknown fields with 400', async () => {
    for (const body of [
      {},
      { title: '   ' },
      { title: 'ok', priority: 'urgent' },
      { title: 'ok', status: 'closed' }, // status is not settable on create
    ]) {
      const res = await createTicket(body);
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body)}`);
      assert.equal(res.body.error.message, 'Validation failed');
    }
  });
});

describe('GET /tickets', () => {
  test('filters by status and paginates newest first', async () => {
    for (let i = 1; i <= 5; i++) await createTicket({ title: `Ticket ${i}` });
    await request(app).patch('/tickets/1').send({ status: 'closed' });

    const page1 = await request(app).get('/tickets?status=open&page=1&limit=3');
    assert.equal(page1.status, 200);
    assert.deepEqual(
      page1.body.data.map((t) => t.id),
      [5, 4, 3],
    );
    assert.deepEqual(page1.body.pagination, { page: 1, limit: 3, total: 4, totalPages: 2 });

    const page2 = await request(app).get('/tickets?status=open&page=2&limit=3');
    assert.deepEqual(
      page2.body.data.map((t) => t.id),
      [2],
    );

    const bad = await request(app).get('/tickets?status=done');
    assert.equal(bad.status, 400);
  });
});

describe('PATCH /tickets/:id', () => {
  test('updates status and priority', async () => {
    const { body: created } = await createTicket({ title: 'VPN down' });

    const res = await request(app)
      .patch(`/tickets/${created.id}`)
      .send({ status: 'in_progress', priority: 'high' });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'in_progress');
    assert.equal(res.body.priority, 'high');
    assert.equal(res.body.title, 'VPN down', 'other fields untouched');
  });

  test('returns 404 for unknown id and 400 for invalid input', async () => {
    const missing = await request(app).patch('/tickets/9999').send({ status: 'closed' });
    assert.equal(missing.status, 404);

    const { body: created } = await createTicket({ title: 'x' });
    const empty = await request(app).patch(`/tickets/${created.id}`).send({});
    assert.equal(empty.status, 400);

    const badId = await request(app).patch('/tickets/abc').send({ status: 'closed' });
    assert.equal(badId.status, 400);
  });
});

describe('GET /tickets/stats', () => {
  test('returns zero counts for every status on an empty table', async () => {
    const res = await request(app).get('/tickets/stats');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { open: 0, in_progress: 0, closed: 0, total: 0 });
  });

  test('counts tickets grouped by status', async () => {
    for (let i = 0; i < 4; i++) await createTicket({ title: `t${i}` });
    await request(app).patch('/tickets/1').send({ status: 'in_progress' });
    await request(app).patch('/tickets/2').send({ status: 'closed' });
    await request(app).patch('/tickets/3').send({ status: 'closed' });

    const res = await request(app).get('/tickets/stats');
    assert.deepEqual(res.body, { open: 1, in_progress: 1, closed: 2, total: 4 });
  });
});
