# Mini Ticket Tracker

A small support-ticket tracker: a REST API (Node.js + Express), a PostgreSQL database, and a single-page React UI.

![List view](docs/list-view.png)

![Board view](docs/board-view.png)

```
server/   Express API, SQL migrations, integration tests
client/   React (Vite) single-page UI
```

## Running it

### Option A — Docker (one command)

Requires Docker with Compose.

```bash
docker compose up --build
```

Open **http://localhost:3000**. The API and the built UI are served from the same container; migrations run automatically on startup. Postgres is exposed on `localhost:5433` (user/password `postgres`/`postgres`; 5433 so it doesn't clash with a local Postgres on 5432), and a separate `tickets_test` database is created for the tests.

### Option B — Local development

Requires Node.js 20+ and a running PostgreSQL 14+.

```bash
# 1. Database (skip if you already have Postgres; or run: docker compose up db)
createdb tickets
createdb tickets_test

# 2. API — http://localhost:3000 (runs migrations on start)
cd server
npm install
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tickets npm run dev

# 3. UI — http://localhost:5173 (proxies /tickets to the API)
cd client
npm install
npm run dev
```

`DATABASE_URL` defaults to `postgres://postgres:postgres@localhost:5432/tickets`, so it can be omitted if that matches your setup. If you use the Docker database (`docker compose up db`) instead, it's on port **5433**, so use `localhost:5433` in the URLs here and below.

### Tests

The tests are integration tests: they boot the real Express app with [supertest](https://github.com/ladjs/supertest) and hit a real Postgres database (`tickets_test`, truncated before each test).

```bash
cd server
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/tickets_test npm test

# or, against the database started by docker compose:
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5433/tickets_test npm test
```

They cover: create (defaults, validation errors, oversized body → 413), list (status filter + pagination), update (status/priority, 404, 400 incl. out-of-range ids), and stats (zero counts and grouped counts).

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/tickets` | Create a ticket. Body: `{ title, description?, priority? }` → `201` |
| `GET` | `/tickets?status=&page=&limit=` | List tickets, newest first. `page` defaults to 1, `limit` defaults to 20 (max 100) |
| `PATCH` | `/tickets/:id` | Update `status` and/or `priority` → `200`, or `404` if not found |
| `GET` | `/tickets/stats` | Count of tickets per status |

Example responses:

```jsonc
// GET /tickets?status=open&page=1&limit=2
{
  "data": [{ "id": 3, "title": "VPN drops", "description": null, "status": "open",
             "priority": "high", "created_at": "2026-10-12T06:48:00.000Z" }],
  "pagination": { "page": 1, "limit": 2, "total": 1, "totalPages": 1 }
}

// GET /tickets/stats
{ "open": 1, "in_progress": 0, "closed": 4, "total": 5 }

// Any error (400 / 404 / 500)
{ "error": { "message": "Validation failed",
             "details": [{ "field": "title", "message": "title is required" }] } }
```

## UI

One page with two views, switched from the header (the choice is remembered per browser):

- **List**: status tabs with counts (from `/tickets/stats`, so they cover all tickets, not just the current page), a paginated table showing priority and status, an inline status pill to change status, and an inline "Add ticket" row.
- **Board**: one column per status. Change a ticket's status by dragging its card to another column, or with the status pill on the card (keyboard-friendly). Each column loads its tickets through the same `GET /tickets?status=` endpoint, 20 at a time with "Show more", up to the API's limit of 100.

Plain CSS with light and dark themes, no UI library. On narrow screens the list rows stack and the board columns scroll sideways.

## Decisions & Tradeoffs

**Assumptions** (where the brief left room):
- New tickets always start as `open`; `status` isn't accepted on create, only `title`, `description` and `priority` (default `medium`).
- Any status can move to any other status (e.g. a closed ticket can be reopened). There are no enforced workflow rules.
- `PATCH` only accepts `status` and `priority`, as the brief describes. Unknown fields are rejected with a 400 rather than silently ignored.
- Invalid query params (e.g. `limit=500`, `status=done`) return a 400 instead of being quietly clamped or dropped.
- Stats always include every status, even with a count of 0, so clients get a stable shape.

**Decisions & shortcuts:**
I kept the backend layered but thin: routes handle HTTP, a repository module holds all the SQL, and zod schemas validate input at the edge. That's enough structure to test and extend without adding an ORM or a service layer that a single table doesn't need. I used raw parameterised SQL through `pg` and a ~60-line forward-only migration runner instead of an ORM or migration framework, which keeps the schema explicit but means no down-migrations. Status and priority are `TEXT` columns with `CHECK` constraints rather than native Postgres enums, because changing the allowed values later is then a simple constraint swap. Pagination is offset-based, which is simple and fine at this size but gets slower and can skip or repeat rows on deep pages while data is changing; with more time I'd switch to cursor (keyset) pagination on `(created_at, id)`. The UI simply re-fetches the list and stats after every change instead of using a data-fetching library or optimistic updates. That's always correct, but it costs an extra request. The brief only asks for a list, but I added a board view because it reuses the existing list endpoint with no backend changes; with tighter time I'd have cut it first. With more time I'd also add authentication and an `updated_at` / audit history for status changes, move the client to TypeScript with types shared with the API, add a couple of UI tests, and set up CI to run the test suite against Postgres on every push.
