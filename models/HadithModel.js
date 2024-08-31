const mongoose = require("mongoose");
const random = require("mongoose-random");

const HadithSchema = new mongoose.Schema({
  text: { type: String, default: "null" },
  hadithNumber: { type: Number, required: true },
  book: { type: Number, required: true },
  hadithsInBook: { type: Number, required: true },
  confirmed: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  skipped: { type: Boolean, default: false },
  author: { type: String, required: true },
});
HadithSchema.plugin(random, { path: "random" });

module.exports = mongoose.model("Hadith", HadithSchema);
