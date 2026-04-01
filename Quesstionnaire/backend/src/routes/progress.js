const express = require('express');
const { query, one } = require('../db');
const { config } = require('../config');

const router = express.Router();

router.get('/progress', async (req, res) => {
  const teamId = req.teamId;
  const contest = await one('select id from contests where name = $1', [config.contestName]);

  const rows = await query(
    `select q.id, q.order_index, q.title, q.difficulty, p.status, p.attempts, p.time_spent_ms, p.best_score
     from questions q
     join team_question_progress p on p.question_id = q.id
     where q.contest_id = $1 and p.team_id = $2
     order by q.order_index asc`,
    [contest.id, teamId]
  );

  res.json({ questions: rows.rows });
});

module.exports = { router };
