const express = require('express');
const { one, query, oneOrNone } = require('../db');

const router = express.Router();

router.post('/hint', async (req, res) => {
  const teamId = req.teamId;
  const { questionId } = req.body || {};
  if (!questionId) return res.status(400).json({ error: 'questionId required' });

  const progress = await oneOrNone(
    'select status, hint_unlocked from team_question_progress where team_id = $1 and question_id = $2',
    [teamId, questionId]
  );
  if (!progress || progress.status === 'locked') {
    return res.status(403).json({ error: 'Question locked' });
  }

  if (!progress.hint_unlocked) {
    await query('update team_question_progress set hint_unlocked = true where team_id = $1 and question_id = $2', [teamId, questionId]);
  }

  const q = await one('select hint from questions where id = $1', [questionId]);
  res.json({ hint: q.hint, hintUnlocked: true });
});

module.exports = { router };
