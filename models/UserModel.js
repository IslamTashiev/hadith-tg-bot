const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
  lastName: { type: String, default: "none" },
  firstName: { type: String, default: "none" },
  username: { type: String, required: true },
  tgId: { type: String, required: true },
  chatId: { type: String, required: true },
  checkYourSelf: { type: mongoose.Types.ObjectId, ref: "CheckYourSelf" },
  questionAttempts: { type: mongoose.Types.ObjectId, ref: "QuestionAttempts" },
  totalScore: { type: Number, default: 0 },
  avatar: { type: String, required: true },
  hadiths: [{ type: mongoose.Types.ObjectId, ref: "Hadith" }],
  answeredQuestions: [{ type: mongoose.Types.ObjectId, ref: "Question" }],
});

module.exports = mongoose.model("User", UserSchema);
