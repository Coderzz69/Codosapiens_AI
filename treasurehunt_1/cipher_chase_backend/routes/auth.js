const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Team = require("../models/Team");

const router = express.Router();

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateTeamKey() {
  const raw = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TEAM-${raw}`;
}

router.post("/register", async (req, res) => {
  try {
    const { name, password, autoKey } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Team name is required" });
    }

    if (!password && !autoKey) {
      return res.status(400).json({ error: "Password or autoKey is required" });
    }

    const existing = await Team.findOne({
      name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
    });

    if (existing) {
      return res.status(409).json({ error: "Team name already exists" });
    }

    let passwordHash = null;
    let teamKeyHash = null;
    let issuedKey = null;

    if (autoKey) {
      issuedKey = generateTeamKey();
      teamKeyHash = await bcrypt.hash(issuedKey, 10);
    } else {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const team = await Team.create({
      name: name.trim(),
      password: passwordHash,
      teamKey: teamKeyHash,
    });

    return res.status(201).json({
      message: "Team registered",
      team: { id: team._id, name: team.name },
      teamKey: issuedKey || undefined,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { name, password, teamKey } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Team name is required" });
    }

    if (!password && !teamKey) {
      return res.status(400).json({ error: "Password or teamKey is required" });
    }

    const team = await Team.findOne({
      name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
    }).select("+password +teamKey");

    if (!team) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let ok = false;
    if (password) {
      ok = team.password ? await bcrypt.compare(password, team.password) : false;
    } else if (teamKey) {
      ok = team.teamKey ? await bcrypt.compare(teamKey, team.teamKey) : false;
    }

    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: team._id, name: team.name },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    return res.json({
      token,
      team: { id: team._id, name: team.name },
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
