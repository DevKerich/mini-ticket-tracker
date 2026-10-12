import { useCallback, useEffect, useState } from 'react';
import { STATUSES, STATUS_LABELS, getStats, listTickets } from './api.js';
import StatsBar from './components/StatsBar.jsx';
import TicketForm from './components/TicketForm.jsx';
import TicketList from './components/TicketList.jsx';

const PAGE_SIZE = 10;

export default function App() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Re-fetch list and stats together after any change. Simpler and always
  // correct versus patching local state by hand; the data set is small.
  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [list, s] = await Promise.all([
        listTickets({ status: statusFilter, page, limit: PAGE_SIZE }),
        getStats(),
      ]);
      // If the current page emptied (e.g. last ticket on it changed status
      // under a filter), step back a page.
      if (list.data.length === 0 && page > 1) {
        setPage(page - 1);
        return;
      }
      setTickets(list.data);
      setPagination(list.pagination);
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const changeFilter = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <main className="container">
      <header>
        <h1>Mini Ticket Tracker</h1>
        <StatsBar stats={stats} />
      </header>

      <TicketForm onCreated={() => (page === 1 ? refresh() : setPage(1))} />

      <section className="card">
        <div className="toolbar">
          <h2>Tickets</h2>
          <label>
            Status{' '}
            <select value={statusFilter} onChange={(e) => changeFilter(e.target.value)}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="error" role="alert">
            {error} <button onClick={refresh}>Retry</button>
          </p>
        )}

        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <TicketList tickets={tickets} onUpdated={refresh} />
        )}

        {pagination && pagination.totalPages > 1 && (
          <nav className="pager" aria-label="Pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ← Prev
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
              Next →
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
