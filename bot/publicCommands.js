const ImageController = require("../controllers/image.controller");
const openaiController = require("../controllers/openai.controller");
const botTexts = require("../data/botText");
const CheckYourSeflModel = require("../models/CheckYourSeflModel");
const UserModel = require("../models/UserModel");
const options = require("../options");
const { getHadith } = require("../services/hadith.service");
const { createQuestion, getUserQuestions } = require("../services/question.service");
const { userCommands, setNewUser, getTopUsers, getTopUsersMarkup } = require("../services/user.service");
const userContexts = require("./context");
const bot = require("./instance");
const fs = require("fs");
module.exports.handlePublicCommands = (bot, msg) => {
  // start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await setNewUser(bot, msg);
      const sticker = fs.readFileSync("public/assalam.webp");
      await bot.sendSticker(chatId, sticker);
      await bot.sendMessage(chatId, botTexts.start, { parse_mode: "Markdown" });
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

  // tops command
  bot.onText(/\/tops/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const topUsers = await getTopUsers();
      const patternBuffer = await ImageController.getTopUsersImage(topUsers);
      const caption = getTopUsersMarkup(topUsers);

      await bot.sendPhoto(chatId, patternBuffer, { caption });
    } catch (err) {
      console.log(err);
      console.error(err.message);
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
      const user = await UserModel.findOne({ tgId }).populate("hadiths").populate("questionAttempts");
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

  // get_name command
  bot.onText(/\/get_name(\s+(\d+))?/, async (msg, match) => {
    try {
      const nameIndex = match[2];
      const chatId = msg.chat.id;
      const imageController = new ImageController();
      const namesJson = await fs.promises.readFile("static/namesOfAllah.json");
      const names = JSON.parse(namesJson);
      let nameObject = null;

      if (nameIndex) {
        if (nameIndex > 99) return bot.sendMessage(chatId, botTexts.set_normal_name);
        nameObject = names[nameIndex - 1];
      } else {
        nameObject = names[Math.floor(Math.random() * 99)];
      }

      const imageBuffer = await imageController.getNameOfAllah(nameObject);
      const caption = nameObject.detailed_desc;
      const isCaptionTooLong = caption.length > 1024;

      await bot.sendPhoto(chatId, imageBuffer, isCaptionTooLong ? {} : { caption });
      isCaptionTooLong ? await bot.sendMessage(chatId, caption) : null;
    } catch (err) {
      console.log(err.message);
    }
  });
};
