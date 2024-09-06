const openaiController = require("../controllers/openai.controller");
const botTexts = require("../data/botText");
const CheckYourSeflModel = require("../models/CheckYourSeflModel");
const UserModel = require("../models/UserModel");
const options = require("../options");
const { getHadith } = require("../services/hadith.service");
const { userCommands } = require("../services/user.service");
const userContexts = require("./context");
const bot = require("./instance");
const fs = require("fs");

module.exports.handlePublicCommands = (bot, msg) => {
  // start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      // await setNewUser(msg);
      await bot.sendMessage(chatId, botTexts.start);
    } catch (e) {
      console.log(e.message);
      await bot.sendMessage(chatId, e.message);
    }
  });

  // check_your_self command
  bot.onText(/\/check_your_self/, async (msg) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id;
    const user = userContexts[chatId]?.currentUser ?? (await UserModel.findOne({ tgId }).populate("checkYourSelf"));

    if (user) {
      const userAttempts = user.checkYourSelf;
      const isUserAttemptsExists = userAttempts.attemptsPerDay > userAttempts.usedAttempts;

      if (isUserAttemptsExists) {
        await bot.sendMessage(chatId, botTexts.chose_dificult, options.dificultLevels);

        bot.emit("chose_dificult", async (dificult) => {
          const rates = {
            1: { max: 300, ratio: 0.5 },
            2: { max: 500, ratio: 0.67 },
            3: { min: 700, ratio: 1.113 },
          };

          const currentRate = rates[dificult];
          const hadith = await getHadith(currentRate.max, currentRate.min);
          const hadithText = `${hadith.title}\n\n${hadith.text}`;

          userContexts[chatId] = { hadith };

          await bot.sendMessage(chatId, hadithText, options.ready);

          bot.emit("ready_to_test", async () => {
            await bot.sendMessage(chatId, botTexts.send_voice);

            bot.emit("audio_upload", async (filePath) => {
              const { text: transcribedText } = await openaiController.transcribe(filePath);
              const response = await openaiController.compareHadith(hadith.text, transcribedText);
              const stats = response.content.split("/");

              const score = Math.round((parseInt(stats[1]) * 0.7 + parseInt(stats[0]) * 0.2) * currentRate.ratio);
              const text = `Вы уловили суть хадиса на ${stats[0]}%, а совпадение слов составило ${stats[1]}%. Вы заработали **${score} очков**, эти очки определят вас в топе.`;

              await UserModel.findByIdAndUpdate(user._id, { totalScore: user.totalScore + score });
              await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
              fs.unlinkSync(filePath);
            });
          });
        });

        await CheckYourSeflModel.findByIdAndUpdate(userAttempts._id, { usedAttempts: userAttempts.usedAttempts + 1 });
      } else {
        await bot.sendMessage(chatId, botTexts.attempts_are_gone);
      }
    }
  });

  bot.onText(/\/commands/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, userCommands(msg.from.id));
  });
};
