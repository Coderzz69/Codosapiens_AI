const express = require('express');
const { query, one, oneOrNone } = require('../db');
const { config } = require('../config');
const { runJudge } = require('../services/judge');

const router = express.Router();

function normalizeLanguage(lang) {
  const v = (lang || '').toLowerCase();
  if (v === 'c' || v === 'gcc') return 'c';
  if (v === 'cpp' || v === 'c++' || v === 'g++') return 'cpp';
  if (v === 'py' || v === 'python' || v === 'python3') return 'py';
  return null;
}

router.post('/run', async (req, res) => {
  const teamId = req.teamId;
  const { questionId, language, source } = req.body || {};
  const lang = normalizeLanguage(language);
  
  if (!questionId || !lang || !source) {
    return res.status(400).json({ error: 'questionId, language, source required' });
  }

  // Ensure they have this question unlocked
  const progress = await oneOrNone(
    'select status from team_question_progress where team_id = $1 and question_id = $2',
    [teamId, questionId]
  );
  if (!progress || progress.status === 'locked') {
    return res.status(403).json({ error: 'Question locked' });
  }

  // Get question time limit
  const q = await one(
    'select time_limit_ms from questions where id = $1',
    [questionId]
  );

  // Pick ONLY the first 3 public test cases to match the frontend UI perfectly
  const visible = await query(
    'select id, input_text, output_text from test_cases where question_id = $1 and is_hidden = false order by id asc limit 3',
    [questionId]
  );
  
  const tests = visible.rows.map(t => ({
    id: t.id,
    input: t.input_text,
    output: t.output_text,
    weight: 1
  }));

  if (tests.length === 0) {
    return res.status(400).json({ error: 'No public test cases configured for this question.' });
  }

  // Run the judge against ONLY these public tests (no hidden ones, no attempt tracking)
  const judge = await runJudge({ language: lang, source, tests, timeLimitMs: q.time_limit_ms || config.timeLimitMsDefault });

  // Map the results specifically for the UI
  const mappedResults = tests.map(t => {
    const rawRes = (judge.testResults || []).find(r => r.id === t.id);
    return {
      testId: t.id,
      input: t.input,
      expectedOutput: t.output,
      actualOutput: rawRes?.actual || '',
      passed: rawRes?.ok || false,
      logs: rawRes?.status ? `Status: ${rawRes.status}` : ''
    };
  });

  res.json({
    verdict: judge.verdict,
    timeMs: judge.timeMs,
    compileLog: judge.compileLog,
    testResults: mappedResults
  });
});

module.exports = { router };
