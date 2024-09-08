const openaiController = require("../controllers/openai.controller");
const botTexts = require("../data/botText");
const CheckYourSeflModel = require("../models/CheckYourSeflModel");
const UserModel = require("../models/UserModel");
const options = require("../options");
const { getHadith } = require("../services/hadith.service");
const { createQuestion, getUserQuestions } = require("../services/question.service");
const { userCommands, setNewUser } = require("../services/user.service");
const userContexts = require("./context");
const bot = require("./instance");
const fs = require("fs");

module.exports.handlePublicCommands = (bot, msg) => {
  // start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await setNewUser(bot, msg);
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
        const currentRate = { max: 500, ratio: 0.67 };
        const hadith = await getHadith(1500, 500);
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

  // hadith command
  bot.onText(/\/hadith/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const hadith = await getHadith();
      const user = userContexts[chatId]?.currentUser ?? (await UserModel.findOne({ tgId: msg.from.id }));
      const hadithText = `${hadith.title}\n\n${hadith.text}`;
      const userHadiths = [...user.hadiths, hadith.id];

      await bot.sendMessage(chatId, hadithText);
      await createQuestion(hadith);
      await UserModel.findOneAndUpdate({ hadiths: userHadiths });
    } catch (err) {
      console.log(err.message);
    }
  });

  // question command
  bot.onText(/\/question/, async (msg) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id;
    try {
      const user =
        userContexts[chatId]?.currentUser ??
        (await UserModel.findOne({ tgId }).populate("hadiths").populate("questionAttempts"));
      const userQuestions = await getUserQuestions(user.hadiths, user.answeredQuestions);

      userContexts[chatId] = { currentUser: user };

      if (user.questionAttempts.attempts <= user.questionAttempts.usedAttempts) {
        return bot.sendMessage(chatId, botTexts.attempts_are_gone);
      }

      if (user.hadiths.length > 0 && userQuestions && userQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * userQuestions.length);
        const question = userQuestions[randomIndex];
        const correctAnswerId = question.answers.findIndex((el) => el === question.correctAnswer);

        if (user?.answeredQuestions?.includes(question._id)) {
          return bot.sendMessage(chatId, botTexts.not_enough);
        }

        const poll = await bot.sendPoll(chatId, question.question, question.answers, {
          type: "quiz",
          correct_option_id: correctAnswerId,
          is_anonymous: false,
        });

        userContexts[poll.poll.id] = { correctAnswerId, poll, chatId, questionId: question._id };
      } else {
        await bot.sendMessage(chatId, botTexts.not_enough);
      }
    } catch (err) {
      console.log("Err in 128 publicCommands.js");
      console.log(err.message);
    }
  });
};
