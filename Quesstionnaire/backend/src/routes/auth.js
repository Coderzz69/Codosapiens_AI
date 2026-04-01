const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, one, oneOrNone } = require('../db');
const { config } = require('../config');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { teamName, pin } = req.body || {};
  if (!teamName || !pin) {
    return res.status(400).json({ error: 'teamName and pin are required' });
  }

  const existing = await oneOrNone('select id, pin_hash from teams where name = $1', [teamName]);
  if (!existing) {
    return res.status(401).json({ error: 'Team not found. Please contact an Administrator to register.' });
  }

  const ok = await bcrypt.compare(pin, existing.pin_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid pin' });

  const token = jwt.sign({ teamId: existing.id }, config.jwtSecret, { expiresIn: '12h' });
  return res.json({ token, teamId: existing.id, teamName });
});

module.exports = { router };
