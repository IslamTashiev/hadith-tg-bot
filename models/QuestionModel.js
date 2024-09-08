const { default: mongoose } = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: { type: String, rquired: true },
  answers: [{ type: String, required: true }],
  hadith: { type: mongoose.Types.ObjectId, ref: "Hadith" },
  correctAnswer: { type: String, rquired: true },
});

module.exports = mongoose.model("Question", QuestionSchema);
