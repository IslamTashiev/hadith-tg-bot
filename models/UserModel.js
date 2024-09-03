const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
  lastName: { type: String, default: "none" },
  firstName: { type: String, default: "none" },
  username: { type: String, required: true },
  tgId: { type: String, required: true },
  chatId: { type: String, required: true },
  checkYourSelf: { type: mongoose.Types.ObjectId, ref: "CheckYourSelf" },
  totalScore: { type: Number, default: 0 },
  avatar: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema);
