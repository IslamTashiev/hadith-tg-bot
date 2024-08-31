const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  author: { type: String, required: true },
  name: { type: String, required: true },
  hadithsCount: { type: Number, required: true },
  book: { type: Number, required: true },
  hadiths: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hadith" }],
});

module.exports = mongoose.model("Book", BookSchema);
