import { useCallback, useEffect, useState } from 'react';
import { getStats } from './api.js';
import BoardView from './components/BoardView.jsx';
import { BoardIcon, ListIcon, TicketIcon } from './components/Icons.jsx';
import TicketList from './components/TicketList.jsx';

const VIEWS = [
  { key: 'list', label: 'List', Icon: ListIcon },
  { key: 'board', label: 'Board', Icon: BoardIcon },
];

// The chosen view is a per-browser convenience; storage may be unavailable
// (private mode), so failures fall back to the list view.
function loadView() {
  try {
    return localStorage.getItem('view') === 'board' ? 'board' : 'list';
  } catch {
    return 'list';
  }
}

export default function App() {
  const [view, setView] = useState(loadView);
  const [stats, setStats] = useState(null);
  // Bumped after every create/update. Views and stats re-fetch when it
  // changes: simpler and always correct versus patching local state by hand.
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [version]);

  function chooseView(key) {
    setView(key);
    try {
      localStorage.setItem('view', key);
    } catch {
      // ignore: the choice just won't persist
    }
  }

  return (
    <main className="container">
      <header className="page-header">
        <h1 className="breadcrumb">
          <TicketIcon className="brand-icon" size={18} />
          <span className="muted">Support</span>
          <span className="sep" aria-hidden="true">
            /
          </span>
          Tickets
        </h1>
        <div className="view-switch" role="group" aria-label="View">
          {VIEWS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => chooseView(key)}
            >
              <Icon /> {label}
            </button>
          ))}
        </div>
      </header>

      {view === 'list' ? (
        <TicketList stats={stats} version={version} onChanged={refresh} />
      ) : (
        <BoardView version={version} onChanged={refresh} />
      )}
    </main>
  );
}
