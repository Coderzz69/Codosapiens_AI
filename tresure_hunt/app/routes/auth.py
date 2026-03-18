from flask import Blueprint, render_template, request, redirect, url_for, session, flash

from app.models.db import get_db
from app.extensions import bcrypt
from app.utils import new_session_token

bp = Blueprint("auth", __name__)


@bp.route("/")
def index():
    return render_template("index.html")


@bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        roll_no = request.form.get("roll_no", "").strip()
        email = request.form.get("email", "").strip().lower()

        if not name or not roll_no or not email:
            flash("All fields are required.", "error")
            return render_template("register.html")

        db = get_db()
        try:
            db.execute(
                "INSERT INTO players (name, roll_no, email) VALUES (?, ?, ?)",
                (name, roll_no, email),
            )
            db.commit()
            flash("Registered. Wait for team assignment.", "success")
            return redirect(url_for("auth.login"))
        except Exception:
            flash("Registration failed. Roll or email may already be used.", "error")

    return render_template("register.html")


@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        team_name = request.form.get("team_name", "").strip()
        password = request.form.get("password", "")

        db = get_db()
        team = db.execute("SELECT * FROM teams WHERE name = ?", (team_name,)).fetchone()
        if not team:
            flash("Invalid team name or password.", "error")
            return render_template("login.html")

        if not bcrypt.check_password_hash(team["password"], password):
            flash("Invalid team name or password.", "error")
            return render_template("login.html")

        # Assign a session index to split Level 2 view (odd/even sessions)
        existing = db.execute(
            "SELECT COUNT(*) AS c FROM active_sessions WHERE team_id = ?",
            (team["id"],),
        ).fetchone()["c"]

        session.clear()
        session["team_id"] = team["id"]
        session["team_name"] = team["name"]
        session["session_token"] = new_session_token()
        session["session_idx"] = existing % 2

        flash("Logged in.", "success")
        return redirect(url_for("challenges.level", n=1))

    return render_template("login.html")


@bp.route("/logout")
def logout():
    session.clear()
    flash("Logged out.", "success")
    return redirect(url_for("auth.index"))
