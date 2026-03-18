from flask import Blueprint, render_template, jsonify

from app.models.db import get_db
from app.utils import compute_score

bp = Blueprint("leaderboard", __name__)


@bp.route("/leaderboard")
def leaderboard():
    return render_template("leaderboard.html")


@bp.route("/api/leaderboard")
def leaderboard_api():
    db = get_db()
    teams = db.execute("SELECT id, name, color FROM teams").fetchall()

    rows = []
    for t in teams:
        score = compute_score(db, t["id"])
        levels = db.execute(
            "SELECT COUNT(*) AS c FROM solves WHERE team_id = ?", (t["id"],)
        ).fetchone()["c"]
        last_solve = db.execute(
            "SELECT MAX(solved_at) AS s FROM solves WHERE team_id = ?", (t["id"],)
        ).fetchone()["s"]
        rows.append(
            {
                "id": t["id"],
                "name": t["name"],
                "color": t["color"],
                "score": score,
                "levels_solved": levels,
                "last_solve": last_solve,
            }
        )

    rows.sort(key=lambda r: (-r["score"], r["last_solve"] or ""))
    return jsonify(rows)


@bp.route("/victory")
def victory():
    return render_template("victory.html")
