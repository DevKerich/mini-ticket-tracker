import { useState } from 'react';
import { PRIORITIES, createTicket } from '../api.js';

const EMPTY = { title: '', description: '', priority: 'medium' };

export default function TicketForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createTicket(form);
      setForm(EMPTY);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h2>New ticket</h2>
      <form onSubmit={handleSubmit} className="ticket-form">
        <label>
          Title
          <input
            value={form.title}
            onChange={set('title')}
            required
            maxLength={200}
            placeholder="Short summary of the issue"
          />
        </label>
        <label>
          <span>
            Description <span className="muted">(optional)</span>
          </span>
          <textarea value={form.description} onChange={set('description')} rows={3} maxLength={5000} />
        </label>
        <div className="form-row">
          <label>
            Priority
            <select value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={submitting || !form.title.trim()}>
            {submitting ? 'Creating…' : 'Create ticket'}
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
