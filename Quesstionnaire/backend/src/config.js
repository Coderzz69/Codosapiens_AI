const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  contestName: process.env.CONTEST_NAME || 'Mind Over Code',
  cooldownSeconds: parseInt(process.env.COOLDOWN_SECONDS || '10', 10),
  penaltySeconds: parseInt(process.env.PENALTY_SECONDS || '20', 10),
  contestDurationMinutes: parseInt(process.env.CONTEST_DURATION_MINUTES || '240', 10),
  maxHiddenPerSubmission: parseInt(process.env.MAX_HIDDEN_PER_SUBMISSION || '5', 10),
  timeLimitMsDefault: parseInt(process.env.TIME_LIMIT_MS_DEFAULT || '2000', 10),
  judgeDockerImage: process.env.JUDGE_DOCKER_IMAGE || 'mind-over-code-judge:latest',
  useDockerJudge: (process.env.USE_DOCKER_JUDGE || 'true').toLowerCase() === 'true'
};

module.exports = { config };
