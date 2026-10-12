// Small pieces shared by the list and board views.
import { useCallback, useState } from 'react';
import { STATUSES, STATUS_LABELS, updateTicket } from '../api.js';
import { fullDate, timeAgo } from '../format.js';
import { FlagIcon } from './Icons.jsx';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

export function PriorityFlag({ priority }) {
  return (
    <span className={`priority priority-${priority}`}>
      <FlagIcon />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

// A real <select> (keyboard and screen-reader friendly) styled as a pill.
export function StatusSelect({ ticket, disabled, onChange }) {
  return (
    <span className={`status-pill status-${ticket.status}`}>
      <span className="dot" aria-hidden="true" />
      <select
        aria-label={`Status of ticket ${ticket.id}`}
        value={ticket.status}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </span>
  );
}

export function TimeAgo({ iso }) {
  return (
    <time dateTime={iso} title={fullDate(iso)} className="muted nowrap">
      {timeAgo(iso)}
    </time>
  );
}

/**
 * Wraps PATCH /tickets/:id with the UI state both views need: which ticket is
 * saving (to disable its control), which one just saved (for a brief
 * highlight), and the last error.
 */
export function useTicketUpdate(onUpdated) {
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [error, setError] = useState(null);

  const update = useCallback(
    async (id, changes) => {
      setSavingId(id);
      setError(null);
      try {
        await updateTicket(id, changes);
        await onUpdated();
        setSavedId(id);
        setTimeout(() => setSavedId((current) => (current === id ? null : current)), 1200);
      } catch (err) {
        setError(`Couldn't update ticket #${id}: ${err.message}`);
      } finally {
        setSavingId(null);
      }
    },
    [onUpdated],
  );

  return { update, savingId, savedId, error };
}
