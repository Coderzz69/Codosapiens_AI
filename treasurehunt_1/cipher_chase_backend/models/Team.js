const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    select: false,
  },
  teamKey: {
    type: String,
    select: false,
  },
  score: {
    type: Number,
    default: 0,
  },
  currentClue: {
    type: Number,
    default: 0, // order index of the clue team is currently on
  },
  hintsUsed: {
    type: [String], // e.g. ["easy", "medium"] for the current clue
    default: [],
  },
  completedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Team", TeamSchema);
