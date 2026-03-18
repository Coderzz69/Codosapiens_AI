import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = os.getenv("DB_PATH", str(BASE_DIR / "instance" / "ctf.db"))

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")

SESSION_TYPE = "filesystem"
SESSION_FILE_DIR = os.getenv("SESSION_FILE_DIR", str(BASE_DIR / "instance" / "flask_session"))
SESSION_PERMANENT = False
SESSION_USE_SIGNER = True

# Scoring
LEVEL_POINTS = {
    1: 100,
    2: 100,
    3: 100,
    4: 100,
    5: 150,
}
FIRST_BLOOD_BONUS = 25
HINT_PENALTY = 10
WRONG_AFTER_FREE = 3
WRONG_PENALTY = 5

# Level 3 founding year (change to your college year)
COLLEGE_FOUNDING_YEAR = os.getenv("COLLEGE_FOUNDING_YEAR", "2001")

# Level 4 Vigenere key (announced verbally)
VIGENERE_KEY = os.getenv("VIGENERE_KEY", "FRESHER")

# Level 4 substitution key words (3rd, 7th, 12th words from villain monologue)
# Adjust these to match the home page text.
SUBSTITUTION_KEY = os.getenv("SUBSTITUTION_KEY", "clock raven signal")

# Flag hashes (sha256). Use tools/generate_flags.py to compute.
FLAG_HASHES = {
    1: os.getenv("FLAG_HASH_L1", ""),
    2: os.getenv("FLAG_HASH_L2", ""),
    3: os.getenv("FLAG_HASH_L3", ""),
    4: os.getenv("FLAG_HASH_L4", ""),
    5: os.getenv("FLAG_HASH_L5", ""),
}

# Plaintext flags for dev only (leave empty in production)
FLAG_PLAINTEXT = {
    1: os.getenv("FLAG_PLAIN_L1", "BOOT{p1_y0u_s33_m3}"),
    2: os.getenv("FLAG_PLAIN_L2", "BOOT{p2_d3c0d3d}"),
    3: os.getenv("FLAG_PLAIN_L3", "BOOT{p3_h34d3rs_sp34k}"),
    4: os.getenv("FLAG_PLAIN_L4", "BOOT{p4_ciphers_crs}"),
    5: os.getenv("FLAG_PLAIN_L5", "BOOT{p5_f1r3w4ll_br34ch3d}"),
}

# Level 5 locks
LOCK1_VALUE = os.getenv("LOCK1_VALUE", "firewall")
LOCK2_VALUE = os.getenv("LOCK2_VALUE", "logic")
# Lock3 expects assembled fragment text, not the final flag
LOCK3_VALUE = os.getenv("LOCK3_VALUE", "BOT{fin4l_k3y_h3r3}")

# Active session timeout in minutes
ACTIVE_SESSION_MINUTES = int(os.getenv("ACTIVE_SESSION_MINUTES", "15"))
