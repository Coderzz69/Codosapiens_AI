import hashlib
import hmac
import secrets
from datetime import datetime

from config import (
    FLAG_HASHES,
    FLAG_PLAINTEXT,
    LEVEL_POINTS,
    FIRST_BLOOD_BONUS,
    HINT_PENALTY,
    WRONG_AFTER_FREE,
    WRONG_PENALTY,
)


def hash_flag(flag: str) -> str:
    return hashlib.sha256(flag.encode("utf-8")).hexdigest()


def verify_flag(level: int, submitted: str) -> bool:
    submitted = (submitted or "").strip()
    if not submitted:
        return False

    expected_hash = FLAG_HASHES.get(level) or ""
    if expected_hash:
        return hmac.compare_digest(hash_flag(submitted), expected_hash)

    # dev fallback
    dev_flag = FLAG_PLAINTEXT.get(level) or ""
    return hmac.compare_digest(submitted, dev_flag)


def new_session_token() -> str:
    return secrets.token_urlsafe(24)


def compute_score(db, team_id: int) -> int:
    cur = db.execute("SELECT level, first_blood FROM solves WHERE team_id = ?", (team_id,))
    solves = cur.fetchall()

    score = 0
    for s in solves:
        score += LEVEL_POINTS.get(s["level"], 0)
        if s["first_blood"]:
            score += FIRST_BLOOD_BONUS

    hint_count = db.execute(
        "SELECT COUNT(*) AS c FROM hint_usage WHERE team_id = ?", (team_id,)
    ).fetchone()["c"]
    score -= hint_count * HINT_PENALTY

    # wrong attempts after free per level
    cur = db.execute(
        "SELECT level, COUNT(*) AS c FROM wrong_attempts WHERE team_id = ? GROUP BY level",
        (team_id,),
    )
    for row in cur.fetchall():
        extra = max(0, row["c"] - WRONG_AFTER_FREE)
        score -= extra * WRONG_PENALTY

    return score


def team_levels_solved(db, team_id: int):
    cur = db.execute("SELECT level FROM solves WHERE team_id = ?", (team_id,))
    return {row["level"] for row in cur.fetchall()}


def mark_first_blood(db, level: int) -> bool:
    row = db.execute("SELECT COUNT(*) AS c FROM solves WHERE level = ?", (level,)).fetchone()
    return row["c"] == 0
