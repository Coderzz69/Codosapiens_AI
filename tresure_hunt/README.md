
# Treasure Hunt App

This is a web-based treasure hunt platform built for the **Codosapiens CS Club (University of Hyderabad)**.  
It’s designed to run coding events where participants solve puzzles in teams and compete on a live leaderboard.

The focus is on simplicity, team coordination, and a fun competitive experience.

---

## What this project does

- Multiple levels with different types of challenges  
- Team-based participation
- Flag-based progression system  
- Live leaderboard to track rankings  
- Hint system (with point deduction)  
- Final level requires all team members to be online together  

---

## Requirements

*   Python 3.10+
*   A terminal in the project root

## Installation & Setup

1. **Clone and Install Dependencies**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and fill in the required variables for your setup. 

   *Note: Use `python app/tools/generate_flags.py` to generate secure flag hashes for the `.env` file.*

3. **Generate Assets**
   Create the required stego image for Level 5:
   ```bash
   python app/tools/encode_stego.py
   ```
   This creates `app/static/assets/stego_image.png`.

4. **Run the Application**
   ```bash
   source venv/bin/activate
   python app.py
   ```
   The application will be accessible at `http://127.0.0.1:5000`.

