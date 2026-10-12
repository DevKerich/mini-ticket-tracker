import { useEffect, useState } from 'react';
import { STATUSES, STATUS_LABELS, getStats, listTickets } from '../api.js';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx';
import TicketForm from './TicketForm.jsx';
import { PriorityFlag, StatusSelect, TimeAgo, useTicketUpdate } from './TicketBits.jsx';

const PAGE_SIZE = 10;

// Status tabs double as the stats display: counts come from /tickets/stats,
// so they're correct for the whole data set, not just the current page.
function StatusTabs({ stats, value, onChange }) {
  const tabs = [{ key: '', label: 'All', count: stats?.total }].concat(
    STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], count: stats?.[s] })),
  );
  return (
    <div className="status-tabs" role="group" aria-label="Filter by status">
      {tabs.map((t) => (
        <button
          key={t.key || 'all'}
          type="button"
          className="status-tab"
          aria-pressed={value === t.key}
          onClick={() => onChange(t.key)}
        >
          {t.key && <span className={`dot status-${t.key}`} aria-hidden="true" />}
          {t.label}
          <span className="count">{t.count ?? '–'}</span>
        </button>
      ))}
    </div>
  );
}

export default function TicketList({ version, onChanged }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { update, savingId, savedId, error: updateError } = useTicketUpdate(onChanged);

  // List and stats load together, so a failure in either shows the same
  // error banner with Retry.
  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([listTickets({ status: statusFilter, page, limit: PAGE_SIZE }), getStats()])
      .then(([list, s]) => {
        if (cancelled) return;
        // If the current page emptied (e.g. its last ticket changed status
        // under a filter), step back a page.
        if (list.data.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }
        setTickets(list.data);
        setPagination(list.pagination);
        setStats(s);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [statusFilter, page, version]);

  const changeFilter = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const onCreated = () => {
    // New tickets are always open; switch away from a tab that would hide it.
    if (statusFilter && statusFilter !== 'open') setStatusFilter('');
    setPage(1);
    onChanged();
  };

  const from = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const to = pagination ? from + tickets.length - 1 : 0;
  const emptyText = statusFilter
    ? `No ${STATUS_LABELS[statusFilter].toLowerCase()} tickets right now.`
    : 'No tickets yet. Add the first one below.';

  return (
    <section aria-label="Ticket list">
      <StatusTabs stats={stats} value={statusFilter} onChange={changeFilter} />

      {(error || updateError) && (
        <p className="banner error" role="alert">
          {error || updateError}{' '}
          {error && (
            <button type="button" onClick={onChanged}>
              Retry
            </button>
          )}
        </p>
      )}

      <table className="tickets" aria-busy={loading}>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Priority</th>
            <th scope="col">Status</th>
            <th scope="col">Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className={savedId === t.id ? 'saved' : undefined}>
              <td className="name-col">
                <div className="name-cell">
                  <span className={`dot status-${t.status}`} aria-hidden="true" />
                  <div>
                    <div className="title">{t.title}</div>
                    {t.description && <div className="description">{t.description}</div>}
                  </div>
                </div>
              </td>
              <td>
                <PriorityFlag priority={t.priority} />
              </td>
              <td>
                <StatusSelect
                  ticket={t}
                  disabled={savingId === t.id}
                  onChange={(status) => update(t.id, { status })}
                />
              </td>
              <td>
                <TimeAgo iso={t.created_at} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loading ? (
        <p className="empty">Loading tickets…</p>
      ) : (
        tickets.length === 0 && !error && <p className="empty">{emptyText}</p>
      )}

      <TicketForm onCreated={onCreated} />

      {pagination && pagination.total > 0 && (
        <nav className="pager" aria-label="Pagination">
          <span>
            {from}–{to} of {pagination.total}
          </span>
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRightIcon />
          </button>
        </nav>
      )}
    </section>
  );
}
