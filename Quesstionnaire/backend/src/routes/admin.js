const express = require('express');
const bcrypt = require('bcryptjs');
const { query, one } = require('../db');
const { config } = require('../config');

const router = express.Router();

function requireSecret(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== (process.env.ADMIN_SECRET || 'codosapiens_admin')) {
    return res.status(403).json({ error: 'Unauthorized: Invalid Admin Secret' });
  }
  next();
}

router.use(requireSecret);

router.get('/teams', async (req, res) => {
  try {
    const teams = await query('SELECT id, name, created_at FROM teams ORDER BY created_at DESC');
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/team', async (req, res) => {
  const { name, pin } = req.body;
  if (!name || !pin) {
    return res.status(400).json({ error: 'Team name and PIN are required' });
  }

  try {
    const hash = await bcrypt.hash(pin.toString(), 10);
    const result = await one(
      'INSERT INTO teams (name, pin_hash) VALUES ($1, $2) RETURNING id',
      [name, hash]
    );
    res.json({ success: true, teamId: result.id, name });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Team name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router };
