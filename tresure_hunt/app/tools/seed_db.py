from flask import Flask
from flask_bcrypt import Bcrypt

from app.models.db import init_db, get_db


def main():
    app = Flask(__name__)
    bcrypt = Bcrypt(app)

    with app.app_context():
        init_db()
        db = get_db()

        name = input("Team name: ").strip()
        password = input("Team password: ").strip()
        color = input("Team color hex (default #6366f1): ").strip() or "#6366f1"

        pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        db.execute(
            "INSERT INTO teams (name, password, color) VALUES (?, ?, ?)",
            (name, pw_hash, color),
        )
        db.commit()
        print("Team created.")


if __name__ == "__main__":
    main()
