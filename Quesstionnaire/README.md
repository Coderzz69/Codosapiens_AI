# Mind Over Code

Three services:
- Backend API (Node.js + Express)
- Team Dashboard (frontend)
- Live Leaderboard (frontend)

## Quick start (Docker)
1. Build the judge image
```bash
docker build -t mind-over-code-judge:latest judge
```

2. Start all services
```bash
docker compose up --build
```

Open:
- Team dashboard: http://localhost:3000
- Leaderboard: http://localhost:3001
- Backend API: http://localhost:4000

## Local dev (no Docker for backend)
1. Start Postgres (or use Docker for just db)
```bash
docker compose up db
```
2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
3. Frontend
```bash
cd frontend
npm install
npm run dev
```
4. Leaderboard
```bash
cd leaderboard
npm install
npm run dev
```

## Notes
- The backend runs a Docker-based judge for C/C++/Python. If Docker is not available, set `USE_DOCKER_JUDGE=false` and only Python submissions will work locally.
- Hidden tests are randomized per submission with a stored test set for audit.
- Leaderboard updates via SSE at `/leaderboard/stream`.
