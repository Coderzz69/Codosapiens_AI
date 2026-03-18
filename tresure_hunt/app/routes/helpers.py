from functools import wraps
from flask import session, redirect, url_for, flash


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("team_id"):
            flash("Please log in.", "error")
            return redirect(url_for("auth.login"))
        return fn(*args, **kwargs)

    return wrapper
