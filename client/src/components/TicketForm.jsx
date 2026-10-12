import { useId, useState } from 'react';
import { PRIORITIES, PRIORITY_LABELS, createTicket } from '../api.js';
import { PlusIcon } from './Icons.jsx';

const EMPTY = { title: '', description: '', priority: 'medium' };

// Inline "+ Add ticket" row that expands into a small form in place.
export default function TicketForm({ onCreated }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError(null);
  };

  function close() {
    setOpen(false);
    setForm(EMPTY);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Enter a title for the ticket.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createTicket(form);
      close();
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="add-row" onClick={() => setOpen(true)}>
        <PlusIcon /> Add ticket
      </button>
    );
  }

  return (
    <form
      className="add-form"
      onSubmit={handleSubmit}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      noValidate
    >
      <div className="add-form-main">
        <label className="sr-only" htmlFor={`${id}-title`}>
          Title
        </label>
        <input
          id={`${id}-title`}
          autoFocus
          value={form.title}
          onChange={set('title')}
          maxLength={200}
          placeholder="Printer on floor 2 is jammed"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <label className="sr-only" htmlFor={`${id}-priority`}>
          Priority
        </label>
        <select id={`${id}-priority`} value={form.priority} onChange={set('priority')}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]} priority
            </option>
          ))}
        </select>
      </div>
      <label className="sr-only" htmlFor={`${id}-description`}>
        Description
      </label>
      <textarea
        id={`${id}-description`}
        value={form.description}
        onChange={set('description')}
        rows={2}
        maxLength={5000}
        placeholder="Description (optional)"
      />
      <div className="add-form-footer">
        <p id={`${id}-error`} className="error" role="alert">
          {error}
        </p>
        <button type="button" onClick={close}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save ticket'}
        </button>
      </div>
    </form>
  );
}
