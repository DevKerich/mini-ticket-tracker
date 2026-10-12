// Thin fetch wrapper: JSON in/out, and API errors surfaced as Error objects
// carrying the server's message (and field details when present).

export const STATUSES = ['open', 'in_progress', 'closed'];
export const PRIORITIES = ['low', 'medium', 'high'];
export const STATUS_LABELS = { open: 'Open', in_progress: 'In progress', closed: 'Closed' };
export const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const details = body?.error?.details?.map((d) => d.message).join(', ');
    const message = body?.error?.message || `Request failed (${res.status})`;
    throw new Error(details ? `${message}: ${details}` : message);
  }
  return body;
}

export function listTickets({ status, page, limit }) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  return request(`/tickets?${params}`);
}

export const getStats = () => request('/tickets/stats');

export const createTicket = (ticket) =>
  request('/tickets', { method: 'POST', body: JSON.stringify(ticket) });

export const updateTicket = (id, changes) =>
  request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
