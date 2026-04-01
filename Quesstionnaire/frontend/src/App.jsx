import React, { useEffect, useRef, useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ── Token management ──────────────────────────────────────────────────────────
function useToken() {
  const [token, setToken] = useState(localStorage.getItem('moc_token') || '');
  const [teamNameStored, setTeamNameStored] = useState(localStorage.getItem('moc_team') || '');
  const save = (t, name) => {
    localStorage.setItem('moc_token', t);
    localStorage.setItem('moc_team', name);
    setToken(t);
    setTeamNameStored(name);
  };
  const clear = () => {
    localStorage.removeItem('moc_token');
    localStorage.removeItem('moc_team');
    setToken('');
    setTeamNameStored('');
  };
  return { token, teamNameStored, save, clear };
}

// ── Generic fetch helper ──────────────────────────────────────────────────────
async function api(path, opts = {}, token) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  // Handle non-JSON or empty bodies gracefully
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) { data = { error: text || 'Unknown error' }; }
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.retryAfterMs = data.retryAfterMs;
    throw err;
  }
  return data;
}

// ── Cooldown countdown hook ───────────────────────────────────────────────────
function useCooldown() {
  const [msLeft, setMsLeft] = useState(0);
  const timerRef = useRef(null);

  const start = useCallback((ms) => {
    setMsLeft(ms);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setMsLeft(prev => {
        if (prev <= 200) { clearInterval(timerRef.current); return 0; }
        return prev - 200;
      });
    }, 200);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);
  return { msLeft, start, active: msLeft > 0 };
}

// ── Submission debounce guard ─────────────────────────────────────────────────
function useSubmitGuard() {
  const inFlight = useRef(false);
  const guard = async (fn) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try { await fn(); } finally { inFlight.current = false; }
  };
  return guard;
}

// ── Verdict badge ─────────────────────────────────────────────────────────────
function VerdictBadge({ verdict }) {
  const map = { AC: '✅ Accepted', WA: '❌ Wrong Answer', TLE: '⏱ Time Limit', RE: '💥 Runtime Error', CE: '🔧 Compile Error' };
  return <span className={`badge badge-${verdict}`}>{map[verdict] || verdict}</span>;
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [teamName, setTeamName] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKey = (e) => { if (e.key === 'Enter') doLogin(); };

  const doLogin = async () => {
    if (!teamName.trim() || !pin.trim()) { setErr('Team name and PIN are required.'); return; }
    setErr('');
    setLoading(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ teamName: teamName.trim(), pin }) });
      onLogin(data.token, teamName.trim());
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app login-screen">
      <div className="login-card">
        <div className="brand-glyph">{'{ }'}</div>
        <h1 className="brand-title">MIND OVER CODE</h1>
        <p className="brand-sub">Neural Challenge Interface</p>
        <div className="login-form">
          <label>TEAM NAME</label>
          <input
            id="inp-team"
            placeholder="e.g. ByteBrigade"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="username"
          />
          <label>ACCESS PIN</label>
          <input
            id="inp-pin"
            type="password"
            placeholder="••••••"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="current-password"
          />
          {err && <div className="err-msg">⚠ {err}</div>}
          <button id="btn-enter" className="btn-primary" onClick={doLogin} disabled={loading}>
            {loading ? <span className="spinner" /> : '⚡ ENTER TERMINAL'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { token, teamNameStored, save, clear } = useToken();
  const [booting, setBooting] = useState(false);
  const [bootErr, setBootErr] = useState('');
  const [progress, setProgress] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [question, setQuestion] = useState(null);
  const [qLoading, setQLoading] = useState(false);
  const [language, setLanguage] = useState('py');
  const [source, setSource] = useState('# Write your solution here\n');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [nextUnlockFlash, setNextUnlockFlash] = useState(false);
  const cooldown = useCooldown();
  const guard = useSubmitGuard();

  const isLoggedIn = !!token;

  // ── Boot: start contest session and load progress ─────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    setBooting(true);
    setBootErr('');
    api('/start', { method: 'POST', body: JSON.stringify({}) }, token)
      .then(() => loadProgress(token))
      .catch(err => setBootErr(err.message))
      .finally(() => setBooting(false));
  }, [isLoggedIn]);

  const loadProgress = async (t = token) => {
    const data = await api('/progress', {}, t);
    const qs = data.questions || [];
    setProgress(qs);
    // Auto-select first unlocked/unsolved question
    setSelectedId(prev => {
      if (prev) return prev;
      const first = qs.find(q => q.status === 'unlocked') || qs.find(q => q.status !== 'locked');
      return first?.id || '';
    });
  };

  // ── Load question on selection or after unlock ────────────────────────────
  useEffect(() => {
    if (!selectedId || !isLoggedIn) return;
    setQLoading(true);
    setResult(null);
    setStatusMsg('');
    api(`/getQuestion?questionId=${selectedId}`, {}, token)
      .then(data => setQuestion(data))
      .catch(err => {
        if (err.status === 401) { clear(); return; }
        setStatusMsg(err.message);
      })
      .finally(() => setQLoading(false));
  }, [selectedId, isLoggedIn]);

  // ── Login callback ────────────────────────────────────────────────────────
  const handleLogin = (t, name) => { save(t, name); };

  // ── Submit with debounce + cooldown guard ─────────────────────────────────
  const submit = () => guard(async () => {
    if (cooldown.active) return;
    setStatusMsg('');
    setResult(null);
    setSubmitting(true);
    try {
      const data = await api('/submit', {
        method: 'POST',
        body: JSON.stringify({ questionId: selectedId, language, source }),
      }, token);
      setResult(data);
      // Refresh question and progress
      await loadProgress();
      const fresh = await api(`/getQuestion?questionId=${selectedId}`, {}, token);
      setQuestion(fresh);
      // Flash unlock if next question opened
      if (data.nextQuestionUnlocked) {
        setNextUnlockFlash(true);
        setTimeout(() => setNextUnlockFlash(false), 3000);
      }
    } catch (err) {
      if (err.status === 401) { clear(); return; }
      if (err.status === 429) {
        cooldown.start(err.retryAfterMs || 10000);
        setStatusMsg(`⏳ Cooldown active — wait ${Math.ceil((err.retryAfterMs || 10000) / 1000)}s before resubmitting.`);
      } else {
        setStatusMsg(`⚠ ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  });

  // ── Hint unlock ────────────────────────────────────────────────────────────
  const unlockHint = async () => {
    setHintLoading(true);
    try {
      const data = await api('/hint', {
        method: 'POST',
        body: JSON.stringify({ questionId: selectedId }),
      }, token);
      setQuestion(q => ({ ...q, hintLocked: false, hint: data.hint }));
    } catch (err) {
      setStatusMsg(`⚠ ${err.message}`);
    } finally {
      setHintLoading(false);
    }
  };

  // ── Question navigation: auto-advance when next question exists ──────────
  const selectQuestion = (id) => {
    setSelectedId(id);
    setQuestion(null);
    setResult(null);
    setStatusMsg('');
  };

  // ── Render: not logged in ─────────────────────────────────────────────────
  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;

  // ── Render: booting ───────────────────────────────────────────────────────
  if (booting) {
    return (
      <div className="app flex-center">
        <div className="boot-msg">
          <span className="spinner" />
          <span>Connecting to neural network…</span>
        </div>
      </div>
    );
  }

  if (bootErr) {
    return (
      <div className="app flex-center">
        <div className="boot-msg err-msg">
          ⚠ {bootErr}
          <button className="btn-ghost mt8" onClick={() => window.location.reload()}>↺ Retry</button>
        </div>
      </div>
    );
  }

  const solvedCount = progress.filter(q => q.status === 'solved').length;
  const totalCount = progress.length;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-glyph-sm">{'{ }'}</span>
          <div>
            <h1 className="app-title">MIND OVER CODE</h1>
            <div className="app-sub">Welcome, <strong>{teamNameStored}</strong></div>
          </div>
        </div>
        <div className="header-right">
          <div className="progress-pill">
            <span className="pill-label">SOLVED</span>
            <span className="pill-val">{solvedCount}/{totalCount}</span>
          </div>
          <a href={`${API_URL.replace('4000','4001')}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">📊 Leaderboard</a>
          <button className="btn-ghost btn-sm" onClick={clear}>⏏ Logout</button>
        </div>
      </header>

      {/* ── Next unlock flash banner ── */}
      {nextUnlockFlash && (
        <div className="unlock-banner" role="alert">
          🔓 Next question unlocked! Scroll down to select it.
        </div>
      )}

      <div className="layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-label">QUESTIONS</div>
          <ul className="q-list">
            {progress.map(q => (
              <li key={q.id}>
                <button
                  id={`q-btn-${q.id}`}
                  className={`q-btn ${q.status} ${q.id === selectedId ? 'active' : ''}`}
                  onClick={() => q.status !== 'locked' && selectQuestion(q.id)}
                  disabled={q.status === 'locked'}
                  title={q.status === 'locked' ? 'Solve the previous question to unlock' : q.title}
                >
                  <span className="q-status-dot" />
                  <div className="q-info">
                    <span className="q-title">{q.order_index}. {q.title}</span>
                    <span className="q-meta">{q.difficulty} · {q.best_score != null ? `${q.best_score} pts` : q.status}</span>
                  </div>
                  {q.status === 'solved' && <span className="q-check">✓</span>}
                  {q.status === 'locked' && <span className="q-lock">🔒</span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Main content ── */}
        <main className="main-content">
          {/* Problem statement */}
          {qLoading && (
            <div className="card loading-card">
              <span className="spinner" /> Loading question…
            </div>
          )}

          {!qLoading && question && (
            <div className="card problem-card">
              <div className="problem-header">
                <div>
                  <h2 className="problem-title">{question.title}</h2>
                  <div className="problem-meta">
                    <span className={`diff-badge diff-${question.difficulty?.toLowerCase()}`}>{question.difficulty}</span>
                    <span className="meta-sep">·</span>
                    <span>Attempts: <strong>{question.attempts}</strong></span>
                    <span className="meta-sep">·</span>
                    <span>Time limit: <strong>{question.timeLimitMs}ms</strong></span>
                  </div>
                </div>
              </div>
              <p className="problem-desc">{question.description}</p>
              <div className="io-grid">
                <div className="io-block">
                  <div className="io-label">INPUT FORMAT</div>
                  <pre className="io-pre">{question.inputFormat}</pre>
                </div>
                <div className="io-block">
                  <div className="io-label">OUTPUT FORMAT</div>
                  <pre className="io-pre">{question.outputFormat}</pre>
                </div>
              </div>

              {/* Hint section */}
              <div className="hint-section">
                {question.hintLocked ? (
                  <button
                    id="btn-unlock-hint"
                    className="btn-ghost btn-sm"
                    onClick={unlockHint}
                    disabled={hintLoading}
                  >
                    {hintLoading ? <span className="spinner" /> : '💡 Unlock Hint'}
                  </button>
                ) : (
                  <div className="hint-box">
                    <span className="hint-label">💡 HINT</span>
                    <p className="hint-text">{question.hint}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code editor */}
          <div className="card editor-card">
            <div className="editor-header">
              <div className="editor-header-left">
                <span className="editor-label">CODE EDITOR</span>
                <select
                  id="sel-language"
                  className="lang-select"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  <option value="py">Python 3</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                </select>
              </div>
              <button
                id="btn-submit"
                className="btn-primary"
                onClick={submit}
                disabled={submitting || cooldown.active || !selectedId}
              >
                {submitting ? <><span className="spinner" /> Judging…</> : cooldown.active ? `⏳ ${Math.ceil(cooldown.msLeft / 1000)}s` : '▶ SUBMIT'}
              </button>
            </div>
            <textarea
              id="code-editor"
              className="code-area"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="// Write your solution here"
              spellCheck={false}
            />

            {/* Result panel */}
            {result && (
              <div className={`result-panel ${result.verdict === 'AC' ? 'result-ac' : 'result-wa'}`}>
                <div className="result-top">
                  <VerdictBadge verdict={result.verdict} />
                  <span className="result-score">Score: <strong>{result.score ?? '—'}</strong></span>
                  <span className="result-time">Time: <strong>{result.timeMs}ms</strong></span>
                  <span className="result-att">Attempt #{result.attempts}</span>
                </div>
                {result.nextQuestionUnlocked && (
                  <div className="result-next">🔓 Next level unlocked! Select it in the sidebar.</div>
                )}
              </div>
            )}

            {/* Status / error */}
            {statusMsg && (
              <div className={`status-msg ${statusMsg.includes('⏳') ? 'status-warn' : 'status-err'}`}>
                {statusMsg}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
