const { default: mongoose } = require("mongoose");

const PatternSchema = new mongoose.Schema({
  filePath: { type: String, required: true },
  textColor: { type: String, required: true },
  photoThone: { type: String, required: true },
});

module.exports = mongoose.model("Pattern", PatternSchema);
