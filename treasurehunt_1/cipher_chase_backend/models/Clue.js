const mongoose = require("mongoose");

const ClueSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
    unique: true,
  },
  question: {
    type: String,
    required: true,
  },
  hints: {
    easy: { type: String, required: true },
    medium: { type: String, required: true },
    hard: { type: String, required: true },
  },
  answer: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
});

module.exports = mongoose.model("Clue", ClueSchema);
