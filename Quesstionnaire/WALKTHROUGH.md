# Codosapiens Challenge Platform - Walkthrough

## Overview
The Codosapiens Challenge Platform consists of three main components:
1. **Backend**: A Node.js/Express application with PostgreSQL for managing teams, questions, submissions, and leaderboard stream (SSE).
2. **Frontend**: A React+Vite application where teams login, view challenges, submit code, and request hints.
3. **Leaderboard**: A React+Vite dashboard that displays live rankings updated via SSE.

## Local Setup & Execution

### 1. Database (PostgreSQL)
The backend expects a PostgreSQL instance running locally on port `5432`.
Run the database via Docker:
```bash
docker run -d --name moc_postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=mindovercode \
  -p 5432:5432 \
  postgres:15
```
*Note: The backend runs migrations and seeds default questions automatically on startup.*

### 2. Backend API
To start the backend server and its local code execution environment:
```bash
cd backend
npm install
npm start
```
By default, the backend will listen on `http://localhost:4000`. Environment variables are defined in `backend/.env`.

### 3. Frontend App (Challenge Interface)
To launch the challenge interface where users login and submit code:
```bash
cd frontend
npm install
npm run dev
```
The frontend is built with React and styled using the "Neural Command" design system (Space Grotesk typography, neon green accents, dark scanning background). Once running, visit `http://localhost:3000` (or `http://localhost:5173` depending on Vite binding).

### 4. Leaderboard App
To launch the live scoreboard:
```bash
cd leaderboard
npm install
npm run dev -- --port 3001
```
The leaderboard uses Server-Sent Events (SSE) to update in real-time as soon as submissions are judged by the backend. It will be available at `http://localhost:3001`.

## Features
- **Code Evaluation (Judge)**: The backend securely evaluates Python/C++ code. It can use either Dockerized isolation or a local bash script depending on the `.env` settings (`USE_DOCKER_JUDGE=false`).
- **Cooldowns**: Teams are put on a 10s cooldown upon making submissions. The Frontend enforces this via a `Retry-After` button countdown.
- **Level Progression**: Successive questions unlock automatically after solving the current level.
- **SSE Stream**: Leaderboard automatically gets pushed new points without refreshing.
- **Resilience**: The Frontend handles `401` authentication drops seamlessly and the Leaderboard uses a 5s automatic retry backoff if the server goes offline.
