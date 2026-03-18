# Operation: First Boot — Walkthrough

This guide covers both organizer setup and participant usage for the CTF treasure hunt web app.

## Organizer Guide

### 1) Prerequisites
- Python 3.10+ installed
- A terminal in the project root

### 2) Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3) Configure Environment
Create a `.env` file based on `.env.example` and fill in real values.

Minimum required:
- `SECRET_KEY`
- `ADMIN_PASSWORD`
- `COLLEGE_FOUNDING_YEAR`
- `FLAG_HASH_L1..L5` (recommended for production)

Generate flag hashes:
```bash
python app/tools/generate_flags.py
```
Copy the output into `.env`.

### 4) Generate the Stego Image
```bash
python app/tools/encode_stego.py
```
This creates `app/static/assets/stego_image.png` used in Level 5.

### 5) Run the Server
```bash
source venv/bin/activate
python app.py
```
The app will be available at `http://127.0.0.1:5000`.

### 6) Organizer Workflow (Before Event)
1. Open `http://127.0.0.1:5000/admin` and log in with `ADMIN_PASSWORD`.
2. Create teams under “Create Team”.
3. Participants register at `/register`.
4. Assign players to teams in the admin dashboard or use “Auto-Assign Players”.
5. Share the team credentials with participants.
6. Announce the Vigenere key (default: `FRESHER`) verbally.

### 7) Organizer Workflow (During Event)
1. Keep `/leaderboard` open on a projector.
2. Monitor hints and solves in the admin dashboard.
3. If needed, reset a team via the admin panel.

### 8) Export Results
Download the CSV at `/admin/export`.

### Organizer Notes
- Update the home page monologue and `SUBSTITUTION_KEY` together if you change the Level 4 key.
- If you want to enforce stego decoding only, remove the fallback in `app/static/js/stego.js`.

## Participant Guide

### 1) Register
Go to `/register` and submit your name, roll number, and email.

### 2) Receive Team Credentials
Your organizer will assign you to a team and share the team login details.

### 3) Login
Go to `/login` and use the team name and password.

### 4) Play the Levels
- Level pages are at `/level/1` through `/level/5`.
- Hints are optional and cost points.
- Use browser dev tools where needed.

### 5) Level 5 Requirement
All team members must be logged in at the same time before the final submission will succeed.

### 6) Leaderboard
See progress at `/leaderboard`.

## Troubleshooting
- If a level won’t load, confirm you finished the previous one.
- If Level 5 stego output is empty, refresh and click “Analyze Image” again.
- If you can’t submit Level 5, ensure all team members are logged in.
