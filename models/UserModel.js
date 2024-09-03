const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
  lastName: { type: String, required: true },
  firstName: { type: String, required: true },
  username: { type: String, required: true },
  tgId: { type: String, required: true },
  chatId: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema);
