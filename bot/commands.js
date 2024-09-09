const bot = require("./instance");
const botTexts = require("../data/botText");
const PatternModel = require("../models/PatternModel");
const userContexts = require("./context");
const fs = require("fs");

const { getHadith, infoMarkup, getUnConfirmedHadith, getVoiceHadith } = require("../services/hadith.service");
const options = require("../options");
const { settingsMarkup, getSettings } = require("../services/setting.service");
const { sendPatterns } = require("../services/pattern.service");
const { getTopUsers, getTopUsersMarkup } = require("../services/user.service");
const ImageController = require("../controllers/image.controller");

module.exports.handlePrivateCommands = (bot, msg) => {
  // send_hadith command
  bot.onText(/\/send_hadith/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const hadith = await getHadith();
      const hadithText = `${hadith.title}\n\n${hadith.text}`;
      const infoMessage = await bot.sendMessage(chatId, infoMarkup(hadith, "Не опубликован"), { parse_mode: "HTML" });

      userContexts[chatId] = { ...infoMessage, hadith };

      await bot.sendMessage(chatId, hadithText, options.hadithMessageOptions);
    } catch (e) {
      console.log(e.message);
      await bot.sendMessage(chatId);
    }
  });

  // sections command
  bot.onText(/\/sections/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      bot.emit("select_section");
      await bot.sendMessage(chatId, botTexts.chose_theme, options.sectionsOption());
    } catch (e) {
      console.log(e.message);
      await bot.sendMessage(chatId);
    }
  });

  // send_photo command
  bot.onText(/\/send_photo/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await sendPatterns("pattern:ASDF?", chatId);
    } catch (e) {
      console.log(e.message);
      await bot.sendMessage(chatId);
    }
  });

  // set_pattern command
  bot.onText(/\/set_pattern/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const patterns = await PatternModel.find();

      if (patterns.length >= 10) {
        return bot.sendMessage(chatId, botTexts.patterns_count);
      }

      await bot.sendMessage(chatId, botTexts.send_pattern);
      bot.emit("set_pattern");
    } catch (e) {
      console.log(e.message);
      await bot.sendMessage(chatId);
    }
  });

  //remove_pattern command
  bot.onText(/\/remove_pattern/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const patterns = await PatternModel.find();
      const patternOption = {
        reply_markup: {
          inline_keyboard: patterns.map((item, index) => [
            { text: "Шаблон № " + (index + 1), callback_data: "remove_pattern:ASDF?" + item._id },
          ]),
        },
      };

      await bot.sendMessage(chatId, botTexts.chose_pattern_to_remove, patternOption);
    } catch (e) {
      console.log(e.message);
      await bot.sendMessage(chatId);
    }
  });

  // settings command
  bot.onText(/\/settings/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const markup = await settingsMarkup();
      await bot.sendMessage(chatId, markup, { parse_mode: "HTML" });
      await bot.sendMessage(chatId, botTexts.for_change_settings);
    } catch (e) {
      console.log(e.message);
      await bot.sendMessage(chatId);
    }
  });

  // change_settings command
  bot.onText(/\/change_settings/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const settings = await getSettings();
      const keyboard = await options.settingsKeyboard(settings);

      bot.sendMessage(chatId, botTexts.chose_setting, keyboard);
      bot.emit("change_pattern_setting");
    } catch (e) {
      console.log(e.message);
      await bot.sendMessage(msg.chat.id);
    }
  });

  // confirm_hadith command
  bot.onText(/\/confirm_hadith/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const hadith = await getUnConfirmedHadith();
      userContexts[chatId] = { hadith, confirmed: false };
      bot.emit("confirm_hadith_emit", { hadith, msg });
      await bot.sendMessage(chatId, hadith.text, options.confirmHadithOption);
    } catch (err) {
      console.log(err.message);
      await bot.sendMessage(chatId);
    }
  });

  // send_voice command
  bot.onText(/\/send_voice/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const hadith = await getVoiceHadith();
      const audio = fs.createReadStream(`audio/${hadith.id}.mp3`);

      await bot.sendAudio(chatId, audio, { title: hadith.book, performer: hadith.author });
    } catch (e) {
      console.log(e.message);
      await bot.sendMessage(chatId);
    }
  });
};
