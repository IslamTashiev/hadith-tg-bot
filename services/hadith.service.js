const HadithController = require("../controllers/hadith.controller");
const ImageController = require("../controllers/image.controller");
const TTSController = require("../controllers/tts.controller");
const authors = require("../data/authors");
const sections = require("../data/sections");
const { getSettings } = require("./setting.service");
const fs = require("fs");

const getHadith = async (maxLength, minLength) => {
  const hadith = await HadithController.getHadith(maxLength, minLength);
  const author = authors[hadith.author];
  const title = `${author}: ${sections[hadith.book] ?? "Не определено"}`;

  return { ...hadith, title };
};
const getHadithById = async (id) => {
  const hadith = await HadithController.getHadithById(id);
  const author = authors[hadith.author];
  const title = `${author}: ${sections[hadith.book] ?? "Не определено"}`;

  return { ...hadith, title };
};
const getUnConfirmedHadith = async () => {
  const hadith = await HadithController.getUnConfirmedHadith();
  const author = authors[hadith.author];
  const title = `${author}: ${sections[hadith.book] ?? "Не определено"}`;

  return { ...hadith, title };
};
const getHadithByBook = async (book) => {
  const hadith = await HadithController.getHadithByBook(book);
  const author = authors[hadith.author];
  const title = `${author}: ${sections[book]}`;

  return { ...hadith, title };
};
const createHadithPhoto = async (input) => {
  const settings = await getSettings();
  const imageController = new ImageController(input ?? settings.default_pattern);
  const hadith = await getHadith(400);
  await imageController.addTextToImage(hadith.text, hadith.title);
  return hadith;
};
const createHadithPhotoByBook = async (input, book) => {
  const settings = await getSettings();
  const imageController = new ImageController(input ?? settings.default_pattern);
  const hadith = await getHadithByBook(book);
  await imageController.addTextToImage(hadith.text, hadith.title);
  return hadith;
};
const getVoiceHadith = async () => {
  const hadith = await HadithController.getHadith(); // надо будет заменить, когда наберется много подтвержденных хадисов
  // const hadith = await HadithController.getHadith(null, 1000);
  const author = authors[hadith.author];
  const book = sections[hadith.book];
  const title = `${author}: ${sections[hadith.book] ?? "Не определено"}`;

  const audioListJson = await fs.promises.readFile("static/audio.json");
  const audioList = JSON.parse(audioListJson);

  if (!audioList[hadith.id]) {
    const textToSpeech = new TTSController();
    await textToSpeech.tts(changeChar(hadith.text + title), hadith.id);
    await fs.promises.writeFile(`static/audio.json`, JSON.stringify({ ...audioList, [hadith.id]: hadith.id }));
  }

  return { ...hadith, book, author };
};
const infoMarkup = (hadith, status) => {
  return `<i>Номер хадиса:</i> <b>${hadith.hadithNumber}</b>\n<i>Книга:</i> <b>${hadith.book}</b>\n<i>Статус:</i> <b>${status}</b>\n<i>Тема:</i> <b>${hadith.title}</b>`;
};
const changeChar = (text) => {
  return text.replace(/ﷺ/g, "мир ему и благославление Аллаха").replace(/Аллах/g, "АЛЛЛАХъ");
};
module.exports = {
  getHadith,
  getHadithByBook,
  createHadithPhoto,
  createHadithPhotoByBook,
  infoMarkup,
  getUnConfirmedHadith,
  getVoiceHadith,
  getHadithById,
};
