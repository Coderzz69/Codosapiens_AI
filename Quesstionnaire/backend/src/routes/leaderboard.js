const express = require('express');
const { query, one } = require('../db');
const { config } = require('../config');
const { addClient } = require('../services/leaderboardHub');

const router = express.Router();

async function getLeaderboard() {
  const contest = await one('select id from contests where name = $1', [config.contestName]);
  const rows = await query(
    `select t.name as team, tc.total_score as score, tc.total_time_ms as time_ms
     from team_contest tc
     join teams t on t.id = tc.team_id
     where tc.contest_id = $1
     order by tc.total_score desc, tc.total_time_ms asc, t.name asc`,
    [contest.id]
  );

  return rows.rows.map((r, idx) => ({ rank: idx + 1, team: r.team, score: r.score, timeMs: r.time_ms }));
}

router.get('/leaderboard', async (req, res) => {
  const rows = await getLeaderboard();
  res.json({ updatedAt: new Date().toISOString(), rows });
});

router.get('/leaderboard/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const rows = await getLeaderboard();
  res.write(`data: ${JSON.stringify({ updatedAt: new Date().toISOString(), rows })}\n\n`);
  addClient(res);
});

module.exports = { router, getLeaderboard };
