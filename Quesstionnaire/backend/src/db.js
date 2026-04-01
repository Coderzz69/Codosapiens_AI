const { Pool } = require('pg');
const { config } = require('./config');

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: config.databaseUrl });

async function query(text, params) {
  return pool.query(text, params);
}

async function one(text, params) {
  const res = await pool.query(text, params);
  if (res.rows.length !== 1) {
    throw new Error('Expected one row');
  }
  return res.rows[0];
}

async function oneOrNone(text, params) {
  const res = await pool.query(text, params);
  if (res.rows.length === 0) return null;
  if (res.rows.length > 1) throw new Error('Expected at most one row');
  return res.rows[0];
}

async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

module.exports = { pool, query, one, oneOrNone, withClient };
