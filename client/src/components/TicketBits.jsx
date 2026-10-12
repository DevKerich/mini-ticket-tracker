// Small pieces shared by the list and board views.
import { useCallback, useEffect, useState } from 'react';
import { PRIORITY_LABELS, STATUSES, STATUS_LABELS, updateTicket } from '../api.js';
import { fullDate, timeAgo } from '../format.js';
import { FlagIcon } from './Icons.jsx';

export function PriorityFlag({ priority }) {
  return (
    <span className={`priority priority-${priority}`}>
      <FlagIcon />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

// A real <select> (keyboard and screen-reader friendly) styled as a pill.
// It shows the picked status straight away instead of snapping back to the
// old one until the save and re-fetch finish, and reverts if the save fails.
// `onChange` must resolve to true on success.
export function StatusSelect({ ticket, disabled, onChange }) {
  const [value, setValue] = useState(ticket.status);
  useEffect(() => setValue(ticket.status), [ticket.status]);

  async function handleChange(next) {
    setValue(next);
    if (!(await onChange(next))) setValue(ticket.status);
  }

  return (
    <span className={`status-pill status-${value}`}>
      <span className="dot" aria-hidden="true" />
      <select
        aria-label={`Status of ticket ${ticket.id}`}
        value={value}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.value)}
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
 * highlight), and the last error. `update` resolves to true if the save
 * succeeded.
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
        return true;
      } catch (err) {
        setError(`Couldn't update ticket #${id}: ${err.message}`);
        return false;
      } finally {
        setSavingId(null);
      }
    },
    [onUpdated],
  );

  return { update, savingId, savedId, error };
}
