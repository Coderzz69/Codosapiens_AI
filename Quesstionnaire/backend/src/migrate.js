const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  if (!sql.trim()) return;
  await pool.query(sql);
}

async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const seedPath = path.join(__dirname, '..', 'seed.sql');
  await runSqlFile(schemaPath);
  await runSqlFile(seedPath);
}

module.exports = { migrate };
