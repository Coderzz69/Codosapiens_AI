const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { migrate } = require('./migrate');
const { requireAuth } = require('./middleware/auth');

const { router: authRouter } = require('./routes/auth');
const { router: startRouter } = require('./routes/start');
const { router: progressRouter } = require('./routes/progress');
const { router: getQuestionRouter } = require('./routes/getQuestion');
const { router: submitRouter } = require('./routes/submit');
const { router: leaderboardRouter } = require('./routes/leaderboard');
const { router: hintRouter } = require('./routes/hint');

async function main() {
  await migrate();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use('/auth', authRouter);
  app.use(leaderboardRouter);

  app.use(requireAuth);
  app.use(startRouter);
  app.use(progressRouter);
  app.use(getQuestionRouter);
  app.use(submitRouter);
  app.use(hintRouter);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  });

  app.listen(config.port, () => {
    console.log(`Backend listening on ${config.port}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
