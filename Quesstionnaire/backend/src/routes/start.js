const express = require('express');
const { query, one, oneOrNone, withClient } = require('../db');
const { config } = require('../config');

const router = express.Router();

router.post('/start', async (req, res) => {
  const teamId = req.teamId;
  const contest = await one('select * from contests where name = $1', [config.contestName]);

  const existing = await oneOrNone(
    'select id, started_at from team_contest where team_id = $1 and contest_id = $2',
    [teamId, contest.id]
  );

  if (!existing) {
    const questions = await query(
      'select id, order_index from questions where contest_id = $1 order by order_index asc',
      [contest.id]
    );

    await withClient(async (client) => {
      await client.query('begin');
      try {
        await client.query(
        'insert into team_contest (team_id, contest_id, started_at) values ($1, $2, now())',
        [teamId, contest.id]
        );

        for (const q of questions.rows) {
          const status = q.order_index === 1 ? 'unlocked' : 'locked';
          if (q.order_index === 1) {
            await client.query(
              'insert into team_question_progress (team_id, question_id, status, unlocked_at) values ($1, $2, $3, now())',
              [teamId, q.id, status]
            );
          } else {
            await client.query(
              'insert into team_question_progress (team_id, question_id, status) values ($1, $2, $3)',
              [teamId, q.id, status]
            );
          }
        }
        await client.query('commit');
      } catch (err) {
        await client.query('rollback');
        throw err;
      }
    });
  }

  const current = await one(
    `select q.id, q.title, q.order_index
     from team_question_progress p
     join questions q on q.id = p.question_id
     where p.team_id = $1 and p.status in ('unlocked','solved')
     order by q.order_index asc
     limit 1`,
    [teamId]
  );

  return res.json({ contestId: contest.id, startedAt: existing?.started_at || new Date().toISOString(), currentQuestionId: current.id });
});

module.exports = { router };
