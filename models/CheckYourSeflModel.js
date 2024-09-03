const { default: mongoose } = require("mongoose");

const CheckYourSeflSchema = new mongoose.Schema({
  attemptsPerDay: { type: Number, default: 1 },
  lastUsed: { type: String, default: "never" },
});

module.exports = mongoose.model("CheckYourSelf", CheckYourSeflSchema);
