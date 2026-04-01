const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { config } = require('../config');

const execFileAsync = promisify(execFile);

function safeWrite(filePath, content) {
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
}

async function runDockerJudge({ language, source, tests, timeLimitMs }) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moc-'));
  const srcFile = language === 'py' ? 'main.py' : language === 'c' ? 'main.c' : 'main.cpp';
  safeWrite(path.join(tmpDir, srcFile), source);
  safeWrite(path.join(tmpDir, 'tests.json'), JSON.stringify({ tests, timeLimitMs }));

  const runnerPath = path.join(__dirname, '..', '..', '..', 'judge', 'runner.py');
  const runnerDest = path.join(tmpDir, 'runner.py');
  fs.copyFileSync(runnerPath, runnerDest);

  const args = [
    'run', '--rm',
    '--network=none',
    '--cpus=1',
    '--memory=512m',
    '--pids-limit=128',
    '-v', `${tmpDir}:/work:rw`,
    config.judgeDockerImage,
    'python3', '/work/runner.py',
    language
  ];

  let stderr = '';
  try {
    const { stderr: err } = await execFileAsync('docker', args, { timeout: 120000 });
    stderr = err || '';
  } catch (err) {
    stderr = err.stderr || err.message || 'Docker judge failed';
  }

  const resultPath = path.join(tmpDir, 'results.json');
  if (!fs.existsSync(resultPath)) {
    const payload = {
      verdict: 'JE',
      timeMs: 0,
      compileLog: stderr,
      execLog: stderr,
      testResults: [],
      assignedTestIds: tests.map(t => t.id)
    };
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return payload;
  }

  const parsed = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const payload = {
    verdict: parsed.verdict,
    timeMs: parsed.timeMs,
    compileLog: parsed.compileLog || '',
    execLog: parsed.execLog || '',
    testResults: parsed.testResults || [],
    assignedTestIds: tests.map(t => t.id)
  };
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return payload;
}

async function runLocalJudge({ language, source, tests, timeLimitMs }) {
  if (language !== 'py') {
    return {
      verdict: 'JE',
      timeMs: 0,
      compileLog: 'Local judge supports only Python. Enable Docker judge for C/C++.',
      execLog: '',
      testResults: [],
      assignedTestIds: tests.map(t => t.id)
    };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moc-local-'));
  const srcFile = path.join(tmpDir, 'main.py');
  const runnerPath = path.join(__dirname, '..', '..', '..', 'judge', 'runner.py');
  const runnerDest = path.join(tmpDir, 'runner.py');
  safeWrite(srcFile, source);
  safeWrite(path.join(tmpDir, 'tests.json'), JSON.stringify({ tests, timeLimitMs: timeLimitMs || 2000 }));
  fs.copyFileSync(runnerPath, runnerDest);

  try {
    await execFileAsync('python3', [runnerDest, 'py'], { cwd: tmpDir, timeout: 60000 });
  } catch (err) {
    // ignore, results.json will indicate failure
  }

  const resultPath = path.join(tmpDir, 'results.json');
  if (!fs.existsSync(resultPath)) {
    const payload = {
      verdict: 'JE',
      timeMs: 0,
      compileLog: 'Local judge failed',
      execLog: '',
      testResults: [],
      assignedTestIds: tests.map(t => t.id)
    };
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return payload;
  }

  const parsed = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const payload = {
    verdict: parsed.verdict,
    timeMs: parsed.timeMs,
    compileLog: parsed.compileLog || '',
    execLog: parsed.execLog || '',
    testResults: parsed.testResults || [],
    assignedTestIds: tests.map(t => t.id)
  };
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return payload;
}

async function runJudge({ language, source, tests, timeLimitMs }) {
  if (config.useDockerJudge) {
    return runDockerJudge({ language, source, tests, timeLimitMs });
  }
  return runLocalJudge({ language, source, tests, timeLimitMs });
}

module.exports = { runJudge };
