const ImageController = require("../controllers/image.controller");
const instagramController = require("../controllers/instagram.controller");
const { getHadith } = require("./hadith.service");
const { getSettings } = require("./setting.service");

const publishPhoto = async () => {
  await instagramController.login();
  await instagramController.publishPhoto("patterns/instagram_output.jpg", postCaption());
};

const createPhoto = async () => {
  const settings = await getSettings();
  const imageController = new ImageController(settings.default_pattern, "patterns/instagram_output.jpg");
  const hadith = await getHadith(400);
  await imageController.addTextToImage(hadith.text, hadith.title, true);

  return hadith;
};

const postPhoto = async () => {
  await createPhoto();
  await publishPhoto();
};

const postCaption = () => {
  return `Ежедневный хадис.\nПодпишись, чтобы получать мудрость каждый день и укреплять свою веру.\n\n🌙 Пусть каждый день будет наполнен светом знаний и духовного роста.\n🔗 Подписывайтесь, делитесь и вдохновляйтесь!\n\n#hadith #hadiths #хадисы #хадис #каждый_день #every_day_hadith #religion #islam #мусульмане #исламскаямудрость #светверы #духовныйрост #хадисы_каждый_день`;
};

module.exports = { publishPhoto, createPhoto, postPhoto };
