const { default: mongoose } = require("mongoose");

const CheckYourSeflSchema = new mongoose.Schema({
  attemptsPerDay: { type: Number, default: 1 },
  usedAttempts: { type: Number, default: 0 },
});

module.exports = mongoose.model("CheckYourSelf", CheckYourSeflSchema);
