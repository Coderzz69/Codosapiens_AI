import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function formatTime(ms) {
  if (!ms && ms !== 0) return '—';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatUpdatedAt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (_) { return iso; }
}

const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function App() {
  const [rows, setRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let es;

    function connect() {
      es = new EventSource(`${API_URL}/leaderboard/stream`);

      es.onopen = () => setConnected(true);

      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          setRows(data.rows || []);
          setUpdatedAt(data.updatedAt || '');
          setConnected(true);
        } catch (_) {}
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Reconnect after 5s
        setTimeout(connect, 5000);
      };
    }

    connect();
    return () => es?.close();
  }, []);

  return (
    <div className="board">
      <header>
        <div className="header-brand">
          <span className="brand-glyph">{'{ }'}</span>
          <div>
            <h1>MIND OVER CODE</h1>
            <div className="sub">LIVE LEADERBOARD</div>
          </div>
        </div>
        <div className="timestamp">
          <div className={`live-badge`}>
            <span className={`pulse-dot${connected ? '' : ' disconnected'}`} style={!connected ? { background: '#ef4444', boxShadow: '0 0 6px #ef4444' } : {}} />
            {connected ? 'LIVE' : 'RECONNECTING…'}
          </div>
          {updatedAt && <span>Updated {formatUpdatedAt(updatedAt)}</span>}
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="empty-state">
          <span className="spinner" />
          Waiting for teams to start…
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Score</th>
              <th>Total Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.team} className={`rank-${r.rank}`}>
                <td className="rank-cell">
                  {RANK_ICONS[r.rank]
                    ? <span className="trophy">{RANK_ICONS[r.rank]}</span>
                    : `#${r.rank}`
                  }
                </td>
                <td className="team-cell">{r.team}</td>
                <td className="score-cell">{r.score ?? 0}</td>
                <td className="time-cell">{formatTime(r.timeMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
