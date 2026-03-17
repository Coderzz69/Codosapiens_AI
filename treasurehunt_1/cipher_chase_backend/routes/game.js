const express = require("express");
const Clue = require("../models/Clue");
const Team = require("../models/Team");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Hint penalty costs
const HINT_COST = { easy: 0, medium: 5, hard: 10 };
const CORRECT_BONUS = 20;

// GET /api/game/clue — get current clue for the team
router.get("/clue", authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.team.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const clue = await Clue.findOne({ order: team.currentClue });
    if (!clue) {
      return res.json({
        finished: true,
        message: "🎉 Congratulations! You completed the treasure hunt!",
        score: team.score,
      });
    }

    return res.json({
      finished: false,
      clueNumber: clue.order + 1,
      totalClues: await Clue.countDocuments(),
      question: clue.question,
      score: team.score,
      hintsUsed: team.hintsUsed,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/game/hint/:level — get a hint (easy / medium / hard)
router.get("/hint/:level", authMiddleware, async (req, res) => {
  try {
    const level = req.params.level.toLowerCase();
    if (!["easy", "medium", "hard"].includes(level)) {
      return res.status(400).json({ error: "Invalid hint level. Use easy, medium, or hard." });
    }

    const team = await Team.findById(req.team.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const clue = await Clue.findOne({ order: team.currentClue });
    if (!clue) return res.status(404).json({ error: "No active clue" });

    // Deduct score only if this hint hasn't been used yet for this clue
    const alreadyUsed = team.hintsUsed.includes(level);
    const cost = alreadyUsed ? 0 : HINT_COST[level];

    if (!alreadyUsed) {
      team.score = Math.max(0, team.score - cost);
      team.hintsUsed.push(level);
      await team.save();
    }

    return res.json({
      level,
      hint: clue.hints[level],
      cost,
      alreadyUsed,
      score: team.score,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/game/answer — submit an answer
router.post("/answer", authMiddleware, async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer || typeof answer !== "string") {
      return res.status(400).json({ error: "Answer is required" });
    }

    const team = await Team.findById(req.team.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const clue = await Clue.findOne({ order: team.currentClue });
    if (!clue) return res.status(400).json({ error: "No active clue to answer" });

    const isCorrect = answer.trim().toLowerCase() === clue.answer.toLowerCase();

    if (!isCorrect) {
      return res.json({ correct: false, message: "❌ Wrong answer! Try again." });
    }

    // Advance to next clue
    const totalClues = await Clue.countDocuments();
    team.score += CORRECT_BONUS;
    team.currentClue += 1;
    team.hintsUsed = []; // reset hints for next clue

    if (team.currentClue >= totalClues) {
      team.completedAt = new Date();
    }

    await team.save();

    const nextClue = await Clue.findOne({ order: team.currentClue });

    return res.json({
      correct: true,
      message: `✅ Correct! +${CORRECT_BONUS} points.`,
      score: team.score,
      finished: !nextClue,
      nextClue: nextClue
        ? { clueNumber: nextClue.order + 1, question: nextClue.question }
        : null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/game/leaderboard — public leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const teams = await Team.find({}, "name score currentClue completedAt createdAt")
      .sort({ score: -1, completedAt: 1, createdAt: 1 })
      .limit(20);

    const totalClues = await Clue.countDocuments();
    return res.json({ leaderboard: teams, totalClues });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
