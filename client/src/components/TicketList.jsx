import { useState } from 'react';
import { STATUSES, STATUS_LABELS, updateTicket } from '../api.js';

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function TicketList({ tickets, onUpdated }) {
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  async function changeStatus(id, status) {
    setSavingId(id);
    setError(null);
    try {
      await updateTicket(id, { status });
      await onUpdated();
    } catch (err) {
      setError(`Could not update ticket #${id}: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  }

  if (tickets.length === 0) return <p className="muted">No tickets yet.</p>;

  return (
    <>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <table className="tickets">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td className="muted">{t.id}</td>
              <td>
                <div className="title">{t.title}</div>
                {t.description && <div className="muted description">{t.description}</div>}
              </td>
              <td>
                <span className={`badge priority-${t.priority}`}>{t.priority}</span>
              </td>
              <td>
                <select
                  aria-label={`Status of ticket ${t.id}`}
                  className={`status-select status-${t.status}`}
                  value={t.status}
                  disabled={savingId === t.id}
                  onChange={(e) => changeStatus(t.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="muted nowrap">{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
