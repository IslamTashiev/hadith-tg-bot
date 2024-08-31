const bot = require("../bot/instance");
const botTexts = require("../data/botText");
const PatternModel = require("../models/PatternModel");

const getPatterns = async () => {
  const patterns = await PatternModel.find();
  return patterns;
};

const sendPatterns = async (callbackData, chatId) => {
  const patterns = await getPatterns();

  if (patterns.length <= 0) {
    return bot.sendMessage(chatId, botTexts.no_pattern);
  }

  const filesForSend = patterns.map((item, index) => ({
    type: "photo",
    media: item.filePath,
    caption: "Шаблон № " + (index + 1),
  }));

  const patternOptions = {
    reply_markup: {
      inline_keyboard: filesForSend.map((option) => [
        { text: option.caption, callback_data: callbackData + option.media },
      ]),
    },
  };

  await bot.sendMediaGroup(chatId, filesForSend);
  await bot.sendMessage(chatId, botTexts.chose_pattern, patternOptions);
};

module.exports = { sendPatterns };
