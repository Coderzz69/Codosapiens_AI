import csv
from app.models.db import get_db, init_db
from flask import Flask


def main():
    app = Flask(__name__)
    with app.app_context():
        init_db()
        db = get_db()
        rows = db.execute(
            "SELECT t.name AS team, s.level, s.solved_at, s.first_blood "
            "FROM solves s JOIN teams t ON s.team_id = t.id ORDER BY s.solved_at ASC"
        ).fetchall()

        with open("results.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["team", "level", "solved_at", "first_blood"])
            for r in rows:
                writer.writerow([r["team"], r["level"], r["solved_at"], r["first_blood"]])
        print("Wrote results.csv")


if __name__ == "__main__":
    main()
