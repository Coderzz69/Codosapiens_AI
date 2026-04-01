const express = require('express');
const { one, oneOrNone } = require('../db');

const router = express.Router();

router.get('/getQuestion', async (req, res) => {
  const teamId = req.teamId;
  const { questionId } = req.query;
  if (!questionId) return res.status(400).json({ error: 'questionId required' });

  const progress = await oneOrNone(
    'select status, attempts, time_spent_ms, hint_unlocked from team_question_progress where team_id = $1 and question_id = $2',
    [teamId, questionId]
  );

  if (!progress || progress.status === 'locked') {
    return res.status(403).json({ error: 'Question locked' });
  }

  const q = await one(
    'select id, title, description, input_format, output_format, difficulty, hint, time_limit_ms from questions where id = $1',
    [questionId]
  );

  res.json({
    id: q.id,
    title: q.title,
    description: q.description,
    inputFormat: q.input_format,
    outputFormat: q.output_format,
    difficulty: q.difficulty,
    timeLimitMs: q.time_limit_ms,
    hintLocked: !progress.hint_unlocked,
    hint: progress.hint_unlocked ? q.hint : null,
    attempts: progress.attempts,
    timeSpentMs: progress.time_spent_ms
  });
});

module.exports = { router };
