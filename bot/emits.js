const ImageController = require("../controllers/image.controller");
const botText = require("../data/botText");
const sections = require("../data/sections");
const HadithModel = require("../models/HadithModel");
const PatternModel = require("../models/PatternModel");
const SettingServices = require("../services/setting.service");
const userContexts = require("./context");
const bot = require("./instance");
const fs = require("fs");

const { hadithMessageOptions, everyDayHadithSettings, everyFridayHadithSettings } = require("../options");
const { getHadithByBook, infoMarkup } = require("../services/hadith.service");
const { sendPatterns } = require("../services/pattern.service");
const { default: axios } = require("axios");
const UserModel = require("../models/UserModel");
const QuestionAttempts = require("../models/QuestionAttempts");
require("dotenv/config");

const token = process.env.TELEGRAM_TOKEN;
let messageListener;
let callbackListener;
// select_section emit
bot.on("select_section", async () => {
  bot.once("message", async (msg) => {
    const section = msg.text;
    const sectionId = Object.values(sections).findIndex((element) => element === section) + 1;
    const hadith = await getHadithByBook(sectionId);
    const hadithText = `${hadith.title}\n\n${hadith.text}`;
    const infoMessage = await bot.sendMessage(msg.chat.id, infoMarkup(hadith, "Не опубликован"), {
      parse_mode: "HTML",
    });

    userContexts[msg.chat.id] = { ...infoMessage, hadith, sectionId };

    await bot.sendMessage(msg.chat.id, hadithText, hadithMessageOptions);
    bot.removeListener("message");
  });
});

// set_pattern emit
bot.on("set_pattern", () => {
  if (messageListener) {
    bot.removeListener("message", messageListener);
  }

  messageListener = async (msg) => {
    if (!msg.photo) return;
    const chatId = msg.chat.id;
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const filePath = "patterns" + `/${file.file_unique_id}.jpg`;

    await ImageController.saveImage(fileUrl, filePath);

    const photoThone = await ImageController.getImageThone(filePath);
    const textColor = photoThone === "dark" ? "white" : "black";

    const data = { filePath, textColor, photoThone };
    const pattern = new PatternModel(data);
    await pattern.save();

    return bot.sendMessage(chatId, botText.pattern_uploaded);
  };

  bot.on("message", messageListener);
});

// change_pattern_setting emit
bot.on("change_pattern_setting", async () => {
  let innerMessageListener;
  if (messageListener) {
    bot.removeListener("message", messageListener);
  }

  messageListener = async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    switch (text) {
      case "default_pattern": {
        const callbackData = "default_pattern:ASDF?";
        await sendPatterns(callbackData, chatId, bot);

        if (callbackListener) bot.removeListener("callback_query", callbackListener);

        callbackListener = async (msg) => {
          const data = msg.data;

          if (data.startsWith(callbackData)) {
            const patternFilePath = data.split(":ASDF?")[1];
            await SettingServices.changePattern(patternFilePath);
            await bot.sendPhoto(chatId, patternFilePath, {
              caption: botText.default_pattern_are_changed,
              reply_markup: { remove_keyboard: true },
            });
            bot.removeListener("callback_query", callbackListener);
          }
        };

        bot.on("callback_query", callbackListener);
        break;
      }

      case "every_day_hadith": {
        await bot.sendMessage(chatId, botText.daily_hadith, everyDayHadithSettings);

        if (callbackListener) bot.removeListener("callback_query", callbackListener);

        callbackListener = async (msg) => {
          const data = msg.data;

          if (data === "every_day_hadith_on") {
            await SettingServices.changeEveryDayHadith(true);
            await bot.sendMessage(chatId, botText.daily_hadith + botText.on);
            bot.removeListener("callback_query", callbackListener);
          } else if (data === "every_day_hadith_off") {
            await SettingServices.changeEveryDayHadith(false);
            await bot.sendMessage(chatId, botText.daily_hadith + botText.off);
            bot.removeListener("callback_query", callbackListener);
          }
        };

        bot.on("callback_query", callbackListener);
        break;
      }

      case "time_of_every_day_hadith": {
        await bot.sendMessage(chatId, botText.every_day_hadith_time);

        if (innerMessageListener) bot.removeListener("message", innerMessageListener);

        innerMessageListener = async (msg) => {
          if (/(\d{2}:\d{2})/.test(msg.text)) {
            await SettingServices.changeEveryDayHadithTime(msg.text);
            await bot.sendMessage(chatId, botText.set_time + msg.text);
            bot.removeListener("message", innerMessageListener);
          } else {
            bot.sendMessage(chatId, botText.send_time);
          }
        };

        bot.on("message", innerMessageListener);
        break;
      }

      case "every_friday_hadith": {
        await bot.sendMessage(chatId, botText.friday_hadith, everyFridayHadithSettings);

        if (callbackListener) bot.removeListener("callback_query", callbackListener);

        callbackListener = async (msg) => {
          const data = msg.data;

          if (data === "every_friday_hadith_on") {
            await SettingServices.changeEveryFridaysHadithTime(true);
            await bot.sendMessage(chatId, botText.friday_hadith + botText.on);
            bot.removeListener("callback_query", callbackListener);
          } else if (data === "every_friday_hadith_off") {
            await SettingServices.changeEveryFridaysHadithTime(false);
            await bot.sendMessage(chatId, botText.friday_hadith + botText.off);
            bot.removeListener("callback_query", callbackListener);
          }
        };

        bot.on("callback_query", callbackListener);
        break;
      }

      case "time_of_every_friday_hadith": {
        await bot.sendMessage(chatId, botText.every_friday_hadith_time);

        if (innerMessageListener) bot.removeListener("message", innerMessageListener);

        innerMessageListener = async (msg) => {
          if (/(\d{2}:\d{2})/.test(msg.text)) {
            await changeEveryFridaysHadithTime(msg.text);
            await bot.sendMessage(msg.chat.id, botText.set_every_week_time + msg.text, {
              reply_markup: { remove_keyboard: true },
            });
            bot.removeListener("message", innerMessageListener);
          } else {
            bot.sendMessage(chatId, botText.send_time);
          }
        };

        bot.on("message", innerMessageListener);
        break;
      }
    }
  };

  bot.on("message", messageListener);
});

// audio_upload emit
bot.on("audio_upload", async (cb) => {
  if (messageListener) {
    bot.removeListener("message", messageListener);
  }

  messageListener = async (msg) => {
    const audio = msg.voice;
    const chatId = msg.chat.id;

    if (audio) {
      const fileId = audio.file_id;

      try {
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        const filePath = `voices/${file.file_unique_id}.mp3`;

        await fs.promises.mkdir("voices", { recursive: true });

        const response = await axios({
          url: fileUrl,
          method: "GET",
          responseType: "stream",
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on("finish", () => {
          console.log(`Файл загружен и сохранен как ${filePath}`);
          bot.removeListener("message", messageListener);
          cb(filePath);
        });
        writer.on("error", (err) => {
          console.error("Ошибка при записи файла:", err.message);
          bot.sendMessage(chatId, "Произошла ошибка при загрузке файла: ", err.message);
        });
      } catch (err) {
        console.error("Ошибка при получении файла:", err.message);
        bot.sendMessage(chatId, "Произошла ошибка при загрузке файла: ", err.message);
      }
    } else {
      if (chatId === userContexts[chatId]?.chatId) {
        await bot.sendMessage(chatId, "Пожалуйста отправьте голосовое сообщение");
      }
    }
  };

  bot.on("message", messageListener);
});

// chose_dificult emit
bot.on("chose_dificult", (cb) => {
  if (callbackListener) bot.removeListener("callback_query", callbackListener);

  callbackListener = async (msg) => {
    const data = msg.data;

    if (data.startsWith("dificult")) {
      const dificult = +data.split("_")[1];
      cb(dificult);
      await bot.deleteMessage(msg.message.chat.id, msg.message.message_id);
    }
  };

  bot.on("callback_query", callbackListener);
});

// ready_to_test emit
bot.on("ready_to_test", (cb) => {
  if (callbackListener) bot.removeListener("callback_query", callbackListener);

  callbackListener = async (msg) => {
    const data = msg.data;

    if (data === "ready") {
      await bot.deleteMessage(msg.message.chat.id, msg.message.message_id);
      cb();
    }
  };

  bot.on("callback_query", callbackListener);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (userContexts[chatId] && userContexts[chatId].edited) {
    const hadith = userContexts[chatId].hadith;

    await HadithModel.findByIdAndUpdate(hadith.id, { text: msg.text, confirmed: true });
    await bot.sendMessage(chatId, infoMarkup(hadith, "Изменен"), { parse_mode: "HTML" });
    await bot.sendMessage(chatId, botText.hadith_updated);

    userContexts[chatId] = {};
  }
});

bot.on("poll_answer", async (pollAnswer) => {
  const userId = pollAnswer.user.id;
  const optionsIds = pollAnswer.option_ids;
  const currentPoll = userContexts[pollAnswer.poll_id];
  if (currentPoll !== undefined) {
    const hadith = await HadithModel.findById(currentPoll.hadithId);
    const user = await UserModel.findOne({ tgId: userId });

    if (optionsIds.includes(currentPoll.correctAnswerId)) {
      await QuestionAttempts.findByIdAndUpdate(user.questionAttempts, { $inc: { usedAttempts: 1 } });
      await bot.sendMessage(userId, botText.correct_answer + hadith.hadithNumber);

      const answeredQuestions = currentPoll.questionId;
      await UserModel.findOneAndUpdate({ tgId: userId }, { $inc: { totalScore: 15 }, $push: { answeredQuestions } });
    } else {
      await bot.sendMessage(userId, botText.incorrect_answer + hadith.hadithNumber);
    }

    await bot.deleteMessage(currentPoll.chatId, currentPoll.poll.message_id);
  }
});

bot.on("send_message_for_everyone", async (cb) => {
  let messageListener;

  if (messageListener) {
    bot.removeListener("message", messageListener);
  }

  messageListener = async (msg) => {
    const text = msg.text;
    cb(text);
  };

  bot.on("message", messageListener);
});
