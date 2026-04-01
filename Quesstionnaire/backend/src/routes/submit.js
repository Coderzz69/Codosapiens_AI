const express = require('express');
const { query, one, oneOrNone, withClient } = require('../db');
const { config } = require('../config');
const { runJudge } = require('../services/judge');
const { calcScore } = require('../services/scoring');
const { broadcast } = require('../services/leaderboardHub');
const { getLeaderboard } = require('./leaderboard');

const router = express.Router();

function normalizeLanguage(lang) {
  const v = (lang || '').toLowerCase();
  if (v === 'c' || v === 'gcc') return 'c';
  if (v === 'cpp' || v === 'c++' || v === 'g++') return 'cpp';
  if (v === 'py' || v === 'python' || v === 'python3') return 'py';
  return null;
}

router.post('/submit', async (req, res) => {
  const teamId = req.teamId;
  const { questionId, language, source } = req.body || {};
  const lang = normalizeLanguage(language);
  if (!questionId || !lang || !source) {
    return res.status(400).json({ error: 'questionId, language, source required' });
  }

  const contest = await one('select * from contests where name = $1', [config.contestName]);

  const progress = await oneOrNone(
    'select status, attempts, unlocked_at, best_score from team_question_progress where team_id = $1 and question_id = $2',
    [teamId, questionId]
  );
  if (!progress || progress.status === 'locked') {
    return res.status(403).json({ error: 'Question locked' });
  }

  const last = await oneOrNone(
    'select last_submission_at from team_contest where team_id = $1 and contest_id = $2',
    [teamId, contest.id]
  );
  if (last?.last_submission_at) {
    const diffMs = Date.now() - new Date(last.last_submission_at).getTime();
    if (diffMs < contest.cooldown_seconds * 1000) {
      return res.status(429).json({ error: 'Cooldown active', retryAfterMs: contest.cooldown_seconds * 1000 - diffMs });
    }
  }

  const q = await one(
    'select difficulty, time_limit_ms from questions where id = $1',
    [questionId]
  );

  const visible = await query(
    'select id, input_text, output_text, weight from test_cases where question_id = $1 and is_hidden = false',
    [questionId]
  );
  const hidden = await query(
    'select id, input_text, output_text, weight from test_cases where question_id = $1 and is_hidden = true order by random() limit $2',
    [questionId, config.maxHiddenPerSubmission]
  );
  const tests = [...visible.rows, ...hidden.rows].map(t => ({
    id: t.id,
    input: t.input_text,
    output: t.output_text,
    weight: t.weight
  }));

  await query(
    'update team_contest set last_submission_at = now() where team_id = $1 and contest_id = $2',
    [teamId, contest.id]
  );

  await query(
    'update team_question_progress set attempts = attempts + 1 where team_id = $1 and question_id = $2',
    [teamId, questionId]
  );

  const judge = await runJudge({ language: lang, source, tests, timeLimitMs: q.time_limit_ms || config.timeLimitMsDefault });

  const weightsTotal = tests.reduce((sum, t) => sum + t.weight, 0);
  const weightsPassed = (judge.testResults || []).filter(r => r.ok).reduce((sum, r) => sum + (r.weight || 0), 0);

  const now = new Date();
  const remainingTimeMs = Math.max(0, new Date(contest.end_time).getTime() - now.getTime());
  const contestDurationMs = Math.max(1, new Date(contest.end_time).getTime() - new Date(contest.start_time).getTime());

  const score = calcScore({
    difficulty: q.difficulty,
    weightsPassed,
    weightsTotal,
    earlyBonusPercent: contest.early_bonus_percent,
    remainingTimeMs,
    contestDurationMs
  });

  await query(
    `insert into submissions (team_id, question_id, language, source_code, status, verdict, score, time_ms, compilation_log, exec_log, test_results, assigned_testcase_ids)
     values ($1, $2, $3, $4, 'done', $5, $6, $7, $8, $9, $10, $11)`,
    [
      teamId,
      questionId,
      lang,
      source,
      judge.verdict,
      score,
      judge.timeMs,
      judge.compileLog,
      judge.execLog,
      JSON.stringify(judge.testResults || []),
      judge.assignedTestIds
    ]
  );

  let nextUnlocked = false;
  await withClient(async (client) => {
    await client.query('begin');
    try {
      const refreshedRes = await client.query(
        'select status, attempts, unlocked_at, best_score from team_question_progress where team_id = $1 and question_id = $2 for update',
        [teamId, questionId]
      );
      const refreshed = refreshedRes.rows[0];

      const newBest = Math.max(refreshed.best_score || 0, score);
      if (newBest !== refreshed.best_score) {
        await client.query(
          'update team_question_progress set best_score = $1 where team_id = $2 and question_id = $3',
          [newBest, teamId, questionId]
        );
      }

      if (judge.verdict === 'AC' && refreshed.status !== 'solved') {
        const solvedAt = new Date();
        const unlockedAt = refreshed.unlocked_at ? new Date(refreshed.unlocked_at) : solvedAt;
        const timeSpentMs = Math.max(0, solvedAt.getTime() - unlockedAt.getTime());
        await client.query(
          'update team_question_progress set status = $1, solved_at = now(), time_spent_ms = $2 where team_id = $3 and question_id = $4',
          ['solved', timeSpentMs, teamId, questionId]
        );

        const penaltyMs = Math.max(0, (refreshed.attempts) - 1) * contest.penalty_seconds * 1000;
        await client.query(
          'update team_contest set total_time_ms = total_time_ms + $1 where team_id = $2 and contest_id = $3',
          [timeSpentMs + penaltyMs, teamId, contest.id]
        );

        const nextRes = await client.query(
          `select q.id from questions q
           join team_question_progress p on p.question_id = q.id
           where p.team_id = $1 and q.order_index > (select order_index from questions where id = $2)
           order by q.order_index asc
           limit 1`,
          [teamId, questionId]
        );
        const next = nextRes.rows[0] || null;

        if (next) {
          await client.query(
            'update team_question_progress set status = $1, unlocked_at = now() where team_id = $2 and question_id = $3 and status = $4',
            ['unlocked', teamId, next.id, 'locked']
          );
          nextUnlocked = true;
        }
      }

      const totalRes = await client.query(
        'select coalesce(sum(best_score),0) as total from team_question_progress where team_id = $1',
        [teamId]
      );
      const total = totalRes.rows[0];
      await client.query(
        'update team_contest set total_score = $1 where team_id = $2 and contest_id = $3',
        [total.total, teamId, contest.id]
      );

      await client.query('commit');
    } catch (err) {
      await client.query('rollback');
      throw err;
    }
  });

  const leaderboard = await getLeaderboard();
  broadcast({ updatedAt: new Date().toISOString(), rows: leaderboard });

  res.json({
    verdict: judge.verdict,
    score,
    timeMs: judge.timeMs,
    partial: judge.verdict !== 'AC',
    attempts: progress.attempts + 1,
    nextQuestionUnlocked: nextUnlocked
  });
});

module.exports = { router };
