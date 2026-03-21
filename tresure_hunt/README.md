# CTF Treasure Hunt Web App

A Capture The Flag (CTF) style treasure hunt web application built with Flask. This platform provides an interactive puzzle-solving experience designed for team participation, featuring a multi-level challenge structure including web exploits, cryptography, and steganography.

## Features

*   **Multi-Level Challenges**: 5 distinct levels encompassing various CTF categories.
*   **Team-Based Gameplay**: Players are organized into teams to collaborate on solving challenges.
*   **Organizer Dashboard**: Dedicated admin panel for managing teams, monitoring progress, and handling hints.
*   **Live Leaderboard**: Real-time scoring and ranking system.
*   **Hint System**: Optional hints available for teams at the cost of points.
*   **Concurrent Requirement**: Unique mechanics like requiring all team members to be online for the final submission.

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
   Copy `.env.example` to `.env` and fill in the required variables for your setup. Minimum variables include:
   *   `SECRET_KEY`
   *   `ADMIN_PASSWORD`
   *   `COLLEGE_FOUNDING_YEAR`
   *   `FLAG_HASH_L1` to `FLAG_HASH_L5` (recommended for production)

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

## Organizer Workflow

1.  Navigate to `http://127.0.0.1:5000/admin` and log in with your `ADMIN_PASSWORD`.
2.  Pre-create teams in the "Create Team" section.
3.  Have participants register via the `/register` portal.
4.  Assign registered players to their respective teams automatically or manually from the dashboard.
5.  Share team login credentials with participants so they can access the levels.
6.  Maintain the `/leaderboard` on a public monitor to keep participants engaged!

At the end of the event, export the final results in CSV format by visiting `/admin/export`.

## Participant Guide

1.  **Register:** Head to `/register` and provide your details.
2.  **Team Up:** Wait for your organizer to assign you to a team and provide your team's login credentials.
3.  **Login:** Access the portal via `/login`.
4.  **Solve:** Navigate through `/level/1` to `/level/5`. Remember, hints cost points!
5.  **Final Challenge:** For the ultimate submission on Level 5, ensure all team members are logged in concurrently.

## Troubleshooting

*   **Level not loading?** Ensure the previous level's flag was successfully evaluated.
*   **Level 5 Stego issues?** Refresh the page and try analyzing the image again.
*   **Cannot submit Level 5?** Coordinate with all your assigned team members to ensure everyone is actively logged in.
