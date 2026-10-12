import { STATUSES, STATUS_LABELS } from '../api.js';

export default function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <dl className="stats">
      {STATUSES.map((s) => (
        <div key={s} className={`stat status-${s}`}>
          <dt>{STATUS_LABELS[s]}</dt>
          <dd>{stats[s]}</dd>
        </div>
      ))}
      <div className="stat">
        <dt>Total</dt>
        <dd>{stats.total}</dd>
      </div>
    </dl>
  );
}
