import os
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, g, session, request
from flask_session import Session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

load_dotenv()

from config import (
    SECRET_KEY,
    SESSION_TYPE,
    SESSION_FILE_DIR,
    SESSION_PERMANENT,
    SESSION_USE_SIGNER,
    ACTIVE_SESSION_MINUTES,
)
from .models.db import init_db, get_db
from .extensions import bcrypt

limiter = Limiter(key_func=get_remote_address, default_limits=["200 per hour"])


def create_app():
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config.update(
        SECRET_KEY=SECRET_KEY,
        SESSION_TYPE=SESSION_TYPE,
        SESSION_FILE_DIR=SESSION_FILE_DIR,
        SESSION_PERMANENT=SESSION_PERMANENT,
        SESSION_USE_SIGNER=SESSION_USE_SIGNER,
    )

    os.makedirs(app.config["SESSION_FILE_DIR"], exist_ok=True)

    Session(app)
    bcrypt.init_app(app)
    limiter.init_app(app)

    with app.app_context():
        init_db()

    # blueprints
    from .routes.auth import bp as auth_bp
    from .routes.challenges import bp as challenges_bp
    from .routes.leaderboard import bp as leaderboard_bp
    from .routes.admin import bp as admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(challenges_bp)
    app.register_blueprint(leaderboard_bp)
    app.register_blueprint(admin_bp)

    @app.before_request
    def touch_session():
        # Track active sessions for level 5 requirement
        team_id = session.get("team_id")
        session_token = session.get("session_token")
        if team_id and session_token:
            db = get_db()
            db.execute(
                """
                INSERT INTO active_sessions (team_id, session_token, last_seen)
                VALUES (?, ?, ?)
                ON CONFLICT(session_token) DO UPDATE SET last_seen=excluded.last_seen
                """,
                (team_id, session_token, datetime.utcnow().isoformat()),
            )
            db.commit()

    @app.after_request
    def add_security_headers(resp):
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Referrer-Policy"] = "no-referrer"
        resp.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline'"  # allow inline for simplicity
        return resp

    @app.teardown_appcontext
    def close_db(exception=None):
        db = g.pop("db", None)
        if db is not None:
            db.close()

    # cleanup stale sessions periodically
    @app.before_request
    def cleanup_stale_sessions():
        db = get_db()
        db.execute(
            "DELETE FROM active_sessions WHERE last_seen < datetime('now', ?)",
            (f"-{ACTIVE_SESSION_MINUTES} minutes",),
        )
        db.commit()

    return app
