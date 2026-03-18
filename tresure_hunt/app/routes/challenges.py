from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, make_response, jsonify

from app.routes.helpers import login_required
from app.models.db import get_db
from app.utils import verify_flag, mark_first_blood, team_levels_solved
from config import COLLEGE_FOUNDING_YEAR, LOCK1_VALUE, LOCK2_VALUE, LOCK3_VALUE

bp = Blueprint("challenges", __name__)

LEVEL_STORY = {
    1: "If you can't even see what's right in front of you, you have no business being here.",
    2: "Computers don't speak English. Can you speak their language?",
    3: "The web has layers you never knew existed. Most people only see the surface.",
    4: "Encryption has protected secrets for centuries. Let's see if you can break mine.",
    5: "You've come further than I expected. But this is where it ends.",
}

LEVEL_HINTS = {
    1: [
        "Every browser has a secret window. Try pressing F12.",
        "Look at the source code, not just the page. Developers leave notes for themselves.",
        "The console tab lets you run commands. Try typing the name of something that would open a lock.",
    ],
    2: [
        "Base64 is a way of turning data into text. There's a tool on this page that can reverse it.",
        "Binary is just 0s and 1s. Eight of them = one character. Try the decoder button.",
        "You only have half the answer. Ask your teammate what they see on their screen.",
    ],
    3: [
        "Every website has a file called robots.txt. Try adding it to the end of the site address.",
        "The page itself isn't hiding the answer. The network is. Check the Network tab in dev tools.",
        "The second clue is a question about your own college. Look it up on the college website.",
    ],
    4: [
        "A Caesar cipher is just a shift. Try every number from 1 to 25. Or think: a baker's dozen is 13.",
        "The Vigenere key is something the host said at the very start of the event today.",
        "For Vault 3: go back to the home page. Count every word in the villain's speech carefully.",
    ],
    5: [
        "The image is hiding something. The tool on this page can see what your eyes cannot. Click Analyze Image.",
        "Read the logic puzzle again very carefully. Sometimes a problem has no solution — and that itself is the answer.",
        "You've been collecting pieces all along. Check your progress panel. The riddle tells you where the last one sleeps.",
    ],
}


def _require_access(team_id: int, level: int) -> bool:
    if level == 1:
        return True
    solved = team_levels_solved(get_db(), team_id)
    return (level - 1) in solved


@bp.route("/level/<int:n>")
@login_required
def level(n):
    if n not in LEVEL_STORY:
        return redirect(url_for("challenges.level", n=1))

    team_id = session.get("team_id")
    if not _require_access(team_id, n):
        flash("Finish the previous level first.", "error")
        return redirect(url_for("challenges.level", n=n - 1))

    db = get_db()
    hints_used = db.execute(
        "SELECT hint_number FROM hint_usage WHERE team_id = ? AND level = ? ORDER BY hint_number",
        (team_id, n),
    ).fetchall()
    hints_used = [row["hint_number"] for row in hints_used]

    solved = db.execute(
        "SELECT 1 FROM solves WHERE team_id = ? AND level = ?",
        (team_id, n),
    ).fetchone()

    session_idx = session.get("session_idx", 0)

    return render_template(
        f"levels/level{n}.html",
        story=LEVEL_STORY[n],
        hints=LEVEL_HINTS[n],
        hints_used=hints_used,
        solved=bool(solved),
        session_idx=session_idx,
        n=n,
    )


@bp.route("/level/<int:n>/submit", methods=["POST"])
@login_required
def submit_flag(n):
    if n not in LEVEL_STORY:
        return redirect(url_for("challenges.level", n=1))

    team_id = session.get("team_id")

    # Level 5 uses lock form instead of raw flag
    if n == 5:
        lock1 = request.form.get("lock1", "").strip().lower()
        lock2 = request.form.get("lock2", "").strip().lower()
        lock3 = request.form.get("lock3", "").strip()

        if lock1 != LOCK1_VALUE.lower() or lock2 != LOCK2_VALUE.lower() or lock3 != LOCK3_VALUE:
            _record_wrong(team_id, n)
            flash("Locks are incorrect.", "error")
            return redirect(url_for("challenges.level", n=5))

        # Check active sessions for all team members
        db = get_db()
        team_size = db.execute(
            "SELECT COUNT(*) AS c FROM players WHERE team_id = ?",
            (team_id,),
        ).fetchone()["c"]
        if team_size == 0:
            team_size = 1
        active = db.execute(
            "SELECT COUNT(*) AS c FROM active_sessions WHERE team_id = ?",
            (team_id,),
        ).fetchone()["c"]
        if active < team_size:
            flash("All team members must be logged in to submit the final lock.", "error")
            return redirect(url_for("challenges.level", n=5))

        # Mark solved without checking flag
        return _mark_solved(team_id, n)

    submitted = request.form.get("flag", "")
    if not verify_flag(n, submitted):
        _record_wrong(team_id, n)
        flash("Wrong flag.", "error")
        return redirect(url_for("challenges.level", n=n))

    return _mark_solved(team_id, n)


@bp.route("/level/<int:n>/hint/<int:h>", methods=["POST"])
@login_required
def request_hint(n, h):
    if n not in LEVEL_HINTS:
        return redirect(url_for("challenges.level", n=1))
    if h not in (1, 2, 3):
        return redirect(url_for("challenges.level", n=n))

    team_id = session.get("team_id")
    db = get_db()
    existing = db.execute(
        "SELECT 1 FROM hint_usage WHERE team_id = ? AND level = ? AND hint_number = ?",
        (team_id, n, h),
    ).fetchone()
    if not existing:
        db.execute(
            "INSERT INTO hint_usage (team_id, level, hint_number) VALUES (?, ?, ?)",
            (team_id, n, h),
        )
        db.commit()
        flash(f"Hint {h} unlocked (-10 pts).", "success")
    return redirect(url_for("challenges.level", n=n))


@bp.route("/robots.txt")
def robots():
    text = """User-agent: *
Disallow: /forgotten-archive/
# The past always leaves traces. Fragment A is in the header.
"""
    resp = make_response(text)
    resp.headers["Content-Type"] = "text/plain"
    return resp


@bp.route("/forgotten-archive/", methods=["GET", "POST"])
@login_required
def forgotten_archive():
    if request.method == "POST":
        year = request.form.get("year", "").strip()
        if year == str(COLLEGE_FOUNDING_YEAR):
            return render_template("levels/forgotten_archive.html",
                                   correct=True,
                                   fragment="3rs_sp34k}")
        return render_template("levels/forgotten_archive.html", correct=False)

    resp = make_response(render_template("levels/forgotten_archive.html", correct=None))
    resp.headers["X-Secret-Fragment"] = "BOOT{p3_h34d"
    resp.headers["X-Next-Clue"] = "What year did this college open its doors?"
    resp.headers["X-Bonus"] = "fin4l"
    return resp


@bp.route("/secret-fragments/last")
@login_required
def secret_fragments_last():
    return "h3r3}"


@bp.route("/level/5/check-sessions")
@login_required
def check_sessions():
    team_id = session.get("team_id")
    db = get_db()
    team_size = db.execute(
        "SELECT COUNT(*) AS c FROM players WHERE team_id = ?", (team_id,)
    ).fetchone()["c"]
    if team_size == 0:
        team_size = 1
    active = db.execute(
        "SELECT COUNT(*) AS c FROM active_sessions WHERE team_id = ?", (team_id,)
    ).fetchone()["c"]
    return jsonify({"active": active, "required": team_size})


@bp.route("/level/5/analyze-image")
@login_required
def analyze_image():
    return jsonify({"decoded": f"LOCK1:{LOCK1_VALUE}"})


def _record_wrong(team_id: int, level: int):
    db = get_db()
    db.execute(
        "INSERT INTO wrong_attempts (team_id, level, attempted_at) VALUES (?, ?, datetime('now'))",
        (team_id, level),
    )
    db.commit()


def _mark_solved(team_id: int, level: int):
    db = get_db()
    existing = db.execute(
        "SELECT 1 FROM solves WHERE team_id = ? AND level = ?",
        (team_id, level),
    ).fetchone()
    if existing:
        flash("Already solved.", "success")
        return redirect(url_for("challenges.level", n=level))

    first_blood = mark_first_blood(db, level)
    db.execute(
        "INSERT INTO solves (team_id, level, first_blood) VALUES (?, ?, ?)",
        (team_id, level, int(first_blood)),
    )
    db.commit()

    flash("Level solved!", "success")
    if level == 5:
        return redirect(url_for("leaderboard.victory"))
    return redirect(url_for("challenges.level", n=level + 1))
