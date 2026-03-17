/* ══════════════════════════════════════════════════════
   TREASURE HUNT — SPA Logic
   ══════════════════════════════════════════════════════ */

const API = "http://localhost:5000/api";

/* ── STATE ── */
let state = {
  token: localStorage.getItem("th_token") || null,
  team: JSON.parse(localStorage.getItem("th_team") || "null"),
  score: 0,
  currentClue: 0,
  totalClues: 5,
  hintsUsed: [],
  loginTab: "password",
  regTab: "password",
};

/* ── HELPERS ── */
function $(id) { return document.getElementById(id); }

function showToast(msg, duration = 3000) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.add("hidden"), duration);
}

function setLoading(btnId, textId, loading, text) {
  const btn = $(btnId);
  if (loading) {
    btn.disabled = true;
    $(textId).textContent = "⏳ Please wait...";
  } else {
    btn.disabled = false;
    $(textId).textContent = text;
  }
}

async function apiFetch(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/* ── PARTICLES ── */
function initParticles() {
  const container = $("particles");
  const colors = ["#f59e0b", "#fbbf24", "#06b6d4", "#10b981", "#a78bfa"];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 5 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${Math.random() * 15 + 10}s;
      animation-delay:${Math.random() * 10}s;
    `;
    container.appendChild(p);
  }
}

/* ── VIEW ROUTING ── */
function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const el = $(`view-${view}`);
  if (el) el.classList.add("active");

  // Navbar visibility
  const authed = ["game", "leaderboard"].includes(view);
  $("navbar").classList.toggle("hidden", !authed);

  // Active nav btn
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  if (view === "game")        $("nav-game").classList.add("active");
  if (view === "leaderboard") $("nav-lb").classList.add("active");

  // Load data
  if (view === "game")        App.loadClue();
  if (view === "leaderboard") App.loadLeaderboard();

  // Reset feedback
  const answerFb = $("answer-feedback");
  if (answerFb) { answerFb.textContent = ""; answerFb.className = "answer-feedback hidden"; }
  const hintDisp = $("hint-display");
  if (hintDisp) hintDisp.classList.add("hidden");
}

/* ── AUTH ── */
function saveAuth(token, team) {
  state.token = token;
  state.team = team;
  localStorage.setItem("th_token", token);
  localStorage.setItem("th_team", JSON.stringify(team));
}

function clearAuth() {
  state.token = null;
  state.team = null;
  localStorage.removeItem("th_token");
  localStorage.removeItem("th_team");
}

function switchLoginTab(tab) {
  state.loginTab = tab;
  $("tab-pass").classList.toggle("active", tab === "password");
  $("tab-key").classList.toggle("active", tab === "key");
  $("login-pass-group").classList.toggle("hidden", tab !== "password");
  $("login-key-group").classList.toggle("hidden", tab !== "key");
}

function switchRegTab(tab) {
  state.regTab = tab;
  $("reg-tab-pass").classList.toggle("active", tab === "password");
  $("reg-tab-key").classList.toggle("active", tab === "key");
  $("reg-pass-group").classList.toggle("hidden", tab !== "password");
}

async function login(e) {
  e.preventDefault();
  const name = $("login-name").value.trim();
  const password = $("login-password").value;
  const teamKey = $("login-teamkey").value.trim();
  const errEl = $("login-error");
  errEl.classList.add("hidden");

  setLoading("login-submit", "login-btn-text", true);
  const body = { name };
  if (state.loginTab === "password") body.password = password;
  else body.teamKey = teamKey;

  const { ok, data } = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) });
  setLoading("login-submit", "login-btn-text", false, "🗝️ Enter the Hunt");

  if (!ok) {
    errEl.textContent = data.error || "Login failed";
    errEl.classList.remove("hidden");
    return;
  }

  saveAuth(data.token, data.team);
  showView("game");
}

async function register(e) {
  e.preventDefault();
  const name = $("reg-name").value.trim();
  const password = $("reg-password").value;
  const autoKey = state.regTab === "key";
  const errEl = $("reg-error");
  errEl.classList.add("hidden");
  $("reg-key-result").classList.add("hidden");

  setLoading("reg-submit", "reg-btn-text", true);
  const body = { name };
  if (autoKey) body.autoKey = true;
  else body.password = password;

  const { ok, data } = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) });
  setLoading("reg-submit", "reg-btn-text", false, "🚀 Register Team");

  if (!ok) {
    errEl.textContent = data.error || "Registration failed";
    errEl.classList.remove("hidden");
    return;
  }

  if (data.teamKey) {
    const box = $("reg-key-result");
    box.innerHTML = `
      <div class="key-label">⚠️ Save your Team Key — shown only once!</div>
      <div class="key-value">${data.teamKey}</div>
      <div class="key-note">Use this key to log in. You cannot recover it.</div>
    `;
    box.classList.remove("hidden");
    showToast("✅ Team registered! Save your key before leaving.", 8000);
  } else {
    showToast("✅ Team registered! Please log in.");
    showView("login");
  }
}

function logout() {
  clearAuth();
  showView("landing");
  showToast("See you next time! 👋");
}

/* ── GAME ── */
async function loadClue() {
  if (!state.token) return;
  $("game-active").style.opacity = "0.5";

  const { ok, data } = await apiFetch("/game/clue");
  $("game-active").style.opacity = "1";
  if (!ok) { showToast("Failed to load clue"); return; }

  updateScore(data.score);
  state.hintsUsed = data.hintsUsed || [];
  state.totalClues = data.totalClues || 5;
  state.currentClue = data.clueNumber || 1;

  if (data.finished) {
    $("game-finished-banner").classList.remove("hidden");
    $("game-active").classList.add("hidden");
    return;
  }

  $("game-finished-banner").classList.add("hidden");
  $("game-active").classList.remove("hidden");

  $("game-question").textContent = data.question;
  $("game-clue-num").textContent = `Clue ${data.clueNumber}`;
  $("game-clue-total").textContent = `of ${data.totalClues}`;
  const pct = ((data.clueNumber - 1) / data.totalClues) * 100;
  $("clue-progress-fill").style.width = `${pct}%`;

  // Sync hint button states
  ["easy", "medium", "hard"].forEach(lvl => {
    const btn = $(`hint-${lvl}`);
    btn.classList.toggle("used", state.hintsUsed.includes(lvl));
  });

  // Clear hint display
  $("hint-display").classList.add("hidden");
  $("answer-input").value = "";
  const fb = $("answer-feedback");
  fb.textContent = ""; fb.className = "answer-feedback hidden";
}

function updateScore(score) {
  state.score = score;
  $("nav-score-val").textContent = score;
}

async function getHint(level) {
  if (!state.token) return;
  const btn = $(`hint-${level}`);
  btn.style.opacity = "0.5";
  btn.disabled = true;

  const { ok, data } = await apiFetch(`/game/hint/${level}`);
  btn.style.opacity = "1";
  btn.disabled = false;

  if (!ok) { showToast(data.error || "Failed to get hint"); return; }

  updateScore(data.score);
  if (!data.alreadyUsed && data.cost > 0) {
    showToast(`💸 −${data.cost} points for the ${level} hint`);
  } else if (data.alreadyUsed) {
    showToast(`ℹ️ You already used this hint (no extra cost)`);
  }

  // Mark used
  if (!state.hintsUsed.includes(level)) {
    state.hintsUsed.push(level);
    btn.classList.add("used");
  }

  // Show hint
  const disp = $("hint-display");
  const badge = $("hint-display-level");
  badge.textContent = level.charAt(0).toUpperCase() + level.slice(1);
  badge.className = `hint-level-badge ${level}`;
  $("hint-display-text").textContent = data.hint;
  disp.classList.remove("hidden");
}

async function submitAnswer(e) {
  e.preventDefault();
  const answer = $("answer-input").value.trim();
  if (!answer) return;

  const btn = $("answer-btn");
  btn.disabled = true;
  $("answer-btn-text").textContent = "⏳ Checking...";

  const { ok, data } = await apiFetch("/game/answer", { method: "POST", body: JSON.stringify({ answer }) });
  btn.disabled = false;
  $("answer-btn-text").textContent = "⚡ Submit";

  if (!ok) { showToast(data.error || "Error submitting answer"); return; }

  const fb = $("answer-feedback");
  fb.textContent = data.message;
  fb.className = `answer-feedback ${data.correct ? "correct" : "wrong"}`;
  fb.classList.remove("hidden");

  if (data.correct) {
    updateScore(data.score);
    showToast(`🎉 ${data.message}`, 3500);
    $("answer-input").value = "";
    if (data.finished) {
      setTimeout(() => {
        $("game-finished-banner").classList.remove("hidden");
        $("game-active").classList.add("hidden");
      }, 1500);
    } else {
      setTimeout(() => loadClue(), 1800);
    }
  }
}

/* ── LEADERBOARD ── */
async function loadLeaderboard() {
  const container = $("lb-content");
  container.innerHTML = '<div class="loading-spinner">Loading...</div>';

  const { ok, data } = await apiFetch("/game/leaderboard");
  if (!ok) { container.innerHTML = '<div class="loading-spinner">Failed to load</div>'; return; }

  const { leaderboard, totalClues } = data;
  if (!leaderboard || leaderboard.length === 0) {
    container.innerHTML = '<div class="loading-spinner">No teams yet. Be the first! 🚀</div>';
    return;
  }

  const rankClasses = ["gold", "silver", "bronze"];
  const rankIcons = ["🥇", "🥈", "🥉"];

  container.innerHTML = leaderboard.map((team, i) => {
    const rankClass = rankClasses[i] || "";
    const rankLabel = i < 3 ? rankIcons[i] : `#${i + 1}`;
    const clueLabel = team.completedAt ? "✅ Completed" : `Clue ${(team.currentClue || 0) + 1} / ${totalClues}`;
    const isMe = state.team && team._id === state.team.id;
    return `
    <div class="lb-row${isMe ? ' lb-row-me' : ''}" style="animation-delay:${i * 0.05}s">
      <div class="lb-rank ${rankClass}">${rankLabel}</div>
      <div>
        <div class="lb-name">${escapeHtml(team.name)}${isMe ? ' <span style="color:var(--gold);font-size:0.75rem;">YOU</span>' : ''}</div>
        <div class="lb-clue">${clueLabel}</div>
      </div>
      <div class="lb-clue"></div>
      <div class="lb-score">${team.score} pts</div>
    </div>`;
  }).join("");
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ── APP INIT ── */
const App = {
  showView, login, register, logout, loadClue, getHint, submitAnswer,
  loadLeaderboard, switchLoginTab, switchRegTab,
};

document.addEventListener("DOMContentLoaded", () => {
  initParticles();

  // Auto-login if token exists
  if (state.token && state.team) {
    showView("game");
  } else {
    showView("landing");
  }
});
