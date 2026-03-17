require("dotenv").config();
const mongoose = require("mongoose");
const Clue = require("./models/Clue");

const clues = [
  {
    order: 0,
    question:
      "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. I have roads, but no cars drive there. What am I?",
    hints: {
      easy: "You use me every day to navigate and find your way around.",
      medium: "I am a flat representation of the world, often folded and carried in a pocket.",
      hard: "Think of something you'd unfold on a road trip or find in an atlas. Answer starts with 'M'.",
    },
    answer: "a map",
  },
  {
    order: 1,
    question:
      "The more you take, the more you leave behind. What am I?",
    hints: {
      easy: "Think about what happens when you walk on a muddy or sandy surface.",
      medium: "Every step creates one of me — they mark where you've been, not where you're going.",
      hard: "They're impressions left in the ground by your feet. Answer: 'footsteps'.",
    },
    answer: "footsteps",
  },
  {
    order: 2,
    question:
      "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?",
    hints: {
      easy: "You might hear me in a canyon or a large empty room when you shout.",
      medium: "I repeat exactly what you say, but I am not a person.",
      hard: "A mountain traveller hears me when they call out loudly. Answer: 'an echo'.",
    },
    answer: "an echo",
  },
  {
    order: 3,
    question:
      "I have keys but no locks. I have space but no room. You can enter, but you can't go inside. What am I?",
    hints: {
      easy: "You use me every day — probably right now, to interact with a computer.",
      medium: "I have a 'Space' bar and an 'Enter' key, but they don't open any doors.",
      hard: "Programmers and writers rely on me. Answer: 'a keyboard'.",
    },
    answer: "a keyboard",
  },
  {
    order: 4,
    question:
      "I'm always in front of you, but can never be seen. What am I?",
    hints: {
      easy: "Everyone experiences me equally — no one can buy more or save it for later.",
      medium: "I move forward constantly, and you're always living in the present moment at my edge.",
      hard: "Philosophers debate whether I'm real. Answer: 'the future'.",
    },
    answer: "the future",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    await Clue.deleteMany({});
    await Clue.insertMany(clues);
    console.log(`✅ Seeded ${clues.length} clues successfully!`);
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
