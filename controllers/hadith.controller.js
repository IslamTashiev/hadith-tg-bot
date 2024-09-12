const HadithDto = require("../dto/hadith.dto");
const HadithModel = require("../models/HadithModel");

class HadithController {
  constructor() {}

  static async getUnConfirmedHadith() {
    const query = { confirmed: false };
    const hadith = await HadithModel.findRandom(query, {}, { limit: 1 });
    const singleHadith = new HadithDto(hadith[0]);
    return singleHadith;
  }
  static async getHadith(maxLength, minLength) {
    const lengthConditions = [];

    if (minLength) {
      lengthConditions.push({ $expr: { $gte: [{ $strLenCP: "$text" }, minLength] } });
    }

    if (maxLength) {
      lengthConditions.push({ $expr: { $lte: [{ $strLenCP: "$text" }, maxLength] } });
    }

    const query = {
      // confirmed: true,
      // published: false,
      ...(lengthConditions.length > 0 && { $and: lengthConditions }),
    };

    const hadith = await HadithModel.findRandom(query, {}, { limit: 1 });
    const singleHadith = new HadithDto(hadith[0]);
    return singleHadith;
  }

  static async getHadithById(id) {
    const hadith = await HadithModel.findOne({ hadithNumber: id });
    const singleHadith = new HadithDto(hadith);
    return singleHadith;
  }

  static async getHadithByBook(book) {
    const query = book ? { book } : {};
    const hadith = await HadithModel.findRandom(query, {}, { limit: 1 });
    const singleHadith = new HadithDto(hadith[0]);
    return singleHadith;
  }
}

module.exports = HadithController;
