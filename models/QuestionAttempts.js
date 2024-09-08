const { default: mongoose } = require("mongoose");

const QuestionAttemptsSchema = new mongoose.Schema({
  attempts: { type: Number, default: 5 },
  usedAttempts: { type: Number, default: 0 },
});

module.exports = mongoose.model("QuestionAttempts", QuestionAttemptsSchema);
