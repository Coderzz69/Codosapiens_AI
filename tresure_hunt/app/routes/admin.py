import csv
import io
import random
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, Response

from app.models.db import get_db
from app.extensions import bcrypt
from config import ADMIN_PASSWORD

bp = Blueprint("admin", __name__, url_prefix="/admin")


def _admin_required():
    return session.get("admin_authed") is True


@bp.route("", methods=["GET", "POST"])
def dashboard():
    if request.method == "POST":
        password = request.form.get("password", "")
        if password == ADMIN_PASSWORD:
            session["admin_authed"] = True
            return redirect(url_for("admin.dashboard"))
        flash("Invalid admin password.", "error")

    if not _admin_required():
        return render_template("admin/login.html")

    db = get_db()
    teams = db.execute("SELECT * FROM teams ORDER BY created_at ASC").fetchall()
    players = db.execute("SELECT * FROM players ORDER BY created_at ASC").fetchall()
    solves = db.execute("SELECT * FROM solves ORDER BY solved_at DESC").fetchall()
    hints = db.execute("SELECT * FROM hint_usage ORDER BY used_at DESC").fetchall()

    return render_template(
        "admin/dashboard.html",
        teams=teams,
        players=players,
        solves=solves,
        hints=hints,
    )


@bp.route("/teams", methods=["POST"])
def create_team():
    if not _admin_required():
        return redirect(url_for("admin.dashboard"))

    name = request.form.get("name", "").strip()
    password = request.form.get("password", "")
    color = request.form.get("color", "#6366f1").strip()

    if not name or not password:
        flash("Team name and password required.", "error")
        return redirect(url_for("admin.dashboard"))

    db = get_db()
    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    try:
        db.execute(
            "INSERT INTO teams (name, password, color) VALUES (?, ?, ?)",
            (name, pw_hash, color),
        )
        db.commit()
        flash("Team created.", "success")
    except Exception:
        flash("Team creation failed (duplicate name?).", "error")

    return redirect(url_for("admin.dashboard"))


@bp.route("/assign", methods=["POST"])
def assign_player():
    if not _admin_required():
        return redirect(url_for("admin.dashboard"))

    player_id = request.form.get("player_id")
    team_id = request.form.get("team_id")

    db = get_db()
    db.execute("UPDATE players SET team_id = ? WHERE id = ?", (team_id, player_id))
    db.commit()
    flash("Player assigned.", "success")
    return redirect(url_for("admin.dashboard"))


@bp.route("/auto-assign", methods=["POST"])
def auto_assign():
    if not _admin_required():
        return redirect(url_for("admin.dashboard"))

    team_size = int(request.form.get("team_size", "4"))
    db = get_db()
    teams = db.execute("SELECT id FROM teams").fetchall()
    players = db.execute("SELECT id FROM players WHERE team_id IS NULL").fetchall()

    if not teams:
        flash("Create teams first.", "error")
        return redirect(url_for("admin.dashboard"))

    random.shuffle(players)
    t_index = 0
    count_in_team = 0
    for p in players:
        db.execute(
            "UPDATE players SET team_id = ? WHERE id = ?",
            (teams[t_index]["id"], p["id"]),
        )
        count_in_team += 1
        if count_in_team >= team_size:
            t_index = (t_index + 1) % len(teams)
            count_in_team = 0

    db.commit()
    flash("Auto-assigned players.", "success")
    return redirect(url_for("admin.dashboard"))


@bp.route("/reset", methods=["POST"])
def reset_team():
    if not _admin_required():
        return redirect(url_for("admin.dashboard"))

    team_id = request.form.get("team_id")
    db = get_db()
    db.execute("DELETE FROM solves WHERE team_id = ?", (team_id,))
    db.execute("DELETE FROM hint_usage WHERE team_id = ?", (team_id,))
    db.execute("DELETE FROM wrong_attempts WHERE team_id = ?", (team_id,))
    db.commit()
    flash("Team progress reset.", "success")
    return redirect(url_for("admin.dashboard"))


@bp.route("/export")
def export():
    if not _admin_required():
        return redirect(url_for("admin.dashboard"))

    db = get_db()
    rows = db.execute(
        "SELECT t.name AS team, s.level, s.solved_at, s.first_blood "
        "FROM solves s JOIN teams t ON s.team_id = t.id ORDER BY s.solved_at ASC"
    ).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["team", "level", "solved_at", "first_blood"])
    for r in rows:
        writer.writerow([r["team"], r["level"], r["solved_at"], r["first_blood"]])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"},
    )
