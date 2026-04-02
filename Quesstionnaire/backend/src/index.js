const express = require('express');
const cors = require('cors');
const path = require('path');
const { config } = require('./config');
const { migrate } = require('./migrate');
const { requireAuth } = require('./middleware/auth');

const { router: authRouter } = require('./routes/auth');
const { router: startRouter } = require('./routes/start');
const { router: progressRouter } = require('./routes/progress');
const { router: getQuestionRouter } = require('./routes/getQuestion');
const { router: submitRouter } = require('./routes/submit');
const { router: runRouter } = require('./routes/run');
const { router: leaderboardRouter } = require('./routes/leaderboard');
const { router: hintRouter } = require('./routes/hint');
const { router: adminRouter } = require('./routes/admin');

async function main() {
  await migrate();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Serve static UI assets in production
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  const leaderboardPath = path.join(__dirname, '../../leaderboard/dist');

  // Leaderboard UI
  app.use('/leaderboard', express.static(leaderboardPath));
  // Frontend UI
  app.use('/', express.static(frontendPath));

  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use('/auth', authRouter);
  app.use(leaderboardRouter);

  // Protected admin routes
  app.use('/admin', adminRouter);

  app.use(requireAuth);
  app.use(startRouter);
  app.use(progressRouter);
  app.use(getQuestionRouter);
  app.use(submitRouter);
  app.use(runRouter);
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
