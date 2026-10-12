import { useEffect, useState } from 'react';
import { STATUSES, STATUS_LABELS, listTickets } from '../api.js';
import TicketForm from './TicketForm.jsx';
import { PriorityFlag, StatusSelect, TimeAgo, useTicketUpdate } from './TicketBits.jsx';

// Each column loads its own status through the existing list endpoint
// (GET /tickets?status=...), so the board needs no extra API. Columns load
// 20 cards and grow on "Show more", up to the API's limit of 100.
const STEP = 20;
const MAX_LIMIT = 100;

function BoardColumn({ status, version, onChanged, updater }) {
  const [limit, setLimit] = useState(STEP);
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const { update, savingId, savedId } = updater;

  useEffect(() => {
    let cancelled = false;
    listTickets({ status, page: 1, limit })
      .then((list) => {
        if (cancelled) return;
        setTickets(list.data);
        setTotal(list.pagination.total);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [status, limit, version]);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const data = JSON.parse(e.dataTransfer.getData('application/json') || 'null');
    if (data && data.status !== status) update(data.id, { status });
  }

  return (
    <section
      className={`board-column${dragOver ? ' drag-over' : ''}`}
      aria-label={`${STATUS_LABELS[status]} tickets`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragOver) setDragOver(true); // dragover fires continuously
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setDragOver(false)}
      onDrop={handleDrop}
    >
      <header className="board-column-header">
        <span className={`status-chip status-${status}`}>
          <span className="dot" aria-hidden="true" />
          {STATUS_LABELS[status]}
        </span>
        <span className="count">{total ?? '–'}</span>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <ul className="board-cards">
        {tickets.map((t) => (
          <li
            key={t.id}
            className={`board-card${savedId === t.id ? ' saved' : ''}`}
            draggable={savingId !== t.id}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ id: t.id, status: t.status }));
              e.dataTransfer.effectAllowed = 'move';
            }}
          >
            <div className="title">{t.title}</div>
            {t.description && <div className="description">{t.description}</div>}
            <div className="board-card-meta">
              <PriorityFlag priority={t.priority} />
              <TimeAgo iso={t.created_at} />
            </div>
            <StatusSelect
              ticket={t}
              disabled={savingId === t.id}
              onChange={(next) => update(t.id, { status: next })}
            />
          </li>
        ))}
      </ul>

      {total === 0 && <p className="empty">Drop tickets here</p>}

      {total > tickets.length && limit < MAX_LIMIT && (
        <button type="button" className="show-more" onClick={() => setLimit(limit + STEP)}>
          Show more ({total - tickets.length})
        </button>
      )}
      {total > tickets.length && limit >= MAX_LIMIT && (
        <p className="muted small">
          Showing {tickets.length} of {total}. Use the list view to see the rest.
        </p>
      )}

      {/* New tickets always start as open, so the add row lives in that column. */}
      {status === 'open' && <TicketForm onCreated={onChanged} />}
    </section>
  );
}

export default function BoardView({ version, onChanged }) {
  const updater = useTicketUpdate(onChanged);
  return (
    <>
      {updater.error && (
        <p className="banner error" role="alert">
          {updater.error}
        </p>
      )}
      <div className="board">
        {STATUSES.map((s) => (
          <BoardColumn key={s} status={s} version={version} onChanged={onChanged} updater={updater} />
        ))}
      </div>
    </>
  );
}
