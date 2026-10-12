// Date helpers for the UI: compact relative times in the list, full
// timestamps on hover.

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export function timeAgo(iso, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export const fullDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
