const ImageController = require("../controllers/image.controller");
const openaiController = require("../controllers/openai.controller");
const botTexts = require("../data/botText");
const CheckYourSeflModel = require("../models/CheckYourSeflModel");
const UserModel = require("../models/UserModel");
const options = require("../options");
const { getHadith, getHadithById } = require("../services/hadith.service");
const { createQuestion, getUserQuestions } = require("../services/question.service");
const { mergeMultipleAudioFiles, getSurahText } = require("../services/quran.service");
const {
  userCommands,
  setNewUser,
  getTopUsers,
  getTopUsersMarkup,
  checkUserSubscription,
} = require("../services/user.service");
const userContexts = require("./context");
const bot = require("./instance");
const fs = require("fs");
require("dotenv").config();
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
    const user = await UserModel.findOne({ tgId }).populate("checkYourSelf");
    // const isSubscribed = await checkUserSubscription(bot, tgId);

    // if (!isSubscribed) {
    //   return bot.sendMessage(chatId, botTexts.join_us + process.env.CHANNEL_ID);
    // }

    if (user) {
      const userAttempts = user.checkYourSelf;
      const isUserAttemptsExists = userAttempts.attemptsPerDay > userAttempts.usedAttempts;

      if (isUserAttemptsExists) {
        const currentRate = { max: 500, ratio: 0.67 };
        const hadith = await getHadith(1500, 500);
        const hadithText = `${hadith.title}\n\n${hadith.text}`;

        userContexts[chatId] = { hadith, chatId };

        await bot.sendMessage(chatId, hadithText, options.ready);

        bot.emit("ready_to_test", async () => {
          await bot.sendMessage(chatId, botTexts.send_voice);

          bot.emit("audio_upload", async (filePath) => {
            const { text: transcribedText } = await openaiController.transcribe(filePath);
            const response = await openaiController.compareHadith(hadith.text, transcribedText);
            const stats = response.content.split("/");

            const score = Math.round((parseInt(stats[1]) * 0.7 + parseInt(stats[0]) * 0.2) * currentRate.ratio);
            const text = `Вы уловили суть хадиса на ${stats[0]}%, а совпадение слов составило ${stats[1]}%. Вы заработали **${score} очков**, эти очки определят вас в топе. Ссылка на хадис \/hadith\\_${hadith.hadithNumber}`;

            await UserModel.findByIdAndUpdate(user._id, { totalScore: user.totalScore + score });
            await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
            fs.unlinkSync(filePath);
            bot.removeListener("audio_upload");
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
    const userId = msg.from.id;
    // const isSubscribed = await checkUserSubscription(bot, userId);

    // if (!isSubscribed) {
    //   return bot.sendMessage(chatId, botTexts.join_us + process.env.CHANNEL_ID);
    // }
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
  bot.onText(/\/hadith(?:_(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    // const isSubscribed = await checkUserSubscription(bot, userId);
    const hadithId = match[1];

    // if (!isSubscribed) {
    //   return bot.sendMessage(chatId, botTexts.join_us + process.env.CHANNEL_ID);
    // }
    try {
      const hadith = hadithId ? await getHadithById(hadithId) : await getHadith(2200);
      const user = await UserModel.findOne({ tgId: msg.from.id });
      const hadithText = `${hadith.title}\n\n${hadith.text}`;
      const userHadiths = hadithId ? user.hadiths : [...user.hadiths, hadith.id];

      await bot.sendMessage(chatId, hadithText);
      await createQuestion(hadith);
      await UserModel.findOneAndUpdate({ tgId: userId }, { hadiths: userHadiths });
    } catch (err) {
      console.log(err.message);
    }
  });

  // question command
  bot.onText(/\/question/, async (msg) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id;
    const userId = msg.from.id;
    // const isSubscribed = await checkUserSubscription(bot, userId);

    // if (!isSubscribed) {
    //   return bot.sendMessage(chatId, botTexts.join_us + process.env.CHANNEL_ID);
    // }
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

        userContexts[poll.poll.id] = {
          correctAnswerId,
          poll,
          chatId,
          questionId: question._id,
          hadithId: question.hadith,
        };
      } else {
        await bot.sendMessage(chatId, botTexts.not_enough);
      }
    } catch (err) {
      console.log("Err in 128 publicCommands.js");
      console.log(err.message);
      await bot.sendMessage(chatId, "Что то пошло не так: " + err.message);
    }
  });

  //quran command
  bot.onText(/\/surah(?:_(\d+))?(?:_([a-zA-Z]+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const surahNumber = match[1] || Math.floor(Math.random() * 114) + 1;
    const reader = match[2] || "mishar";

    try {
      const surahPath = `quran/${reader}/quran_${surahNumber}.mp3`;
      const surah = fs.createReadStream(surahPath);
      const loader = await bot.sendMessage(chatId, "Подготовка файла...");
      await bot.sendAudio(chatId, surah);
      await bot.deleteMessage(chatId, loader.message_id);
    } catch (err) {
      console.log(err.message);
    }
  });

  //ayah command
  bot.onText(/\/listen_surah_(\d+)_ayah_(\d+)(?:_to_(\d+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const surah = Number(match[1]);
    const ayahStart = Number(match[2]);
    const ayahEnd = Number(match[3]) || ayahStart;
    const pathToSurah = `quran/yasser_by_ayah/${surah.toString().padStart(3, "0")}`;
    let statusMessageId;

    try {
      const statusMessage = await bot.sendMessage(chatId, "🔍: проверка файлов...");
      statusMessageId = statusMessage.message_id;

      await fs.promises.access(pathToSurah);

      const surahInfoJson = await fs.promises.readFile(`${pathToSurah}/info.json`);
      const surahInfo = JSON.parse(surahInfoJson);

      if (surahInfo.metadata.total_verses < ayahEnd) {
        return await bot.editMessageText(
          `Пожалуйста, укажите корректный аят суры - *${surahInfo.metadata.translation}*, начиная с 1 до ${surahInfo.metadata.total_verses}`,
          { chat_id: chatId, message_id: statusMessageId, parse_mode: "Markdown" }
        );
      }

      await bot.editMessageText("📂: подготовка файлов...", { chat_id: chatId, message_id: statusMessageId });

      const ayahs = [];

      for (let i = ayahStart; i <= ayahEnd; i++) {
        const ayahPath = `${pathToSurah}/${i.toString().padStart(3, "0")}.mp3`;

        try {
          await fs.promises.access(ayahPath);
          ayahs.push({
            path: ayahPath,
            verse: surahInfo.ayahs[i - 1],
          });
        } catch (err) {
          console.error(`Файл аята не найден: ${ayahPath}`);
          return await bot.editMessageText(`Файл аята не найден: ${i}`, {
            chat_id: chatId,
            message_id: statusMessageId,
          });
        }
      }

      await bot.editMessageText("🔄: слияние файлов...", { chat_id: chatId, message_id: statusMessageId });

      const ayahsBuffer =
        ayahEnd === surahInfo.metadata.total_verses && ayahStart === 1
          ? await fs.promises.readFile(`quran/yasser/quran_${surah}.mp3`)
          : await mergeMultipleAudioFiles(ayahs.map((el) => el.path));

      await bot.editMessageText("✈️: отправка файла...", { chat_id: chatId, message_id: statusMessageId });

      await bot.sendAudio(chatId, ayahsBuffer);
      await bot.sendMessage(chatId, ayahs.map((el) => `${el.verse.verse}. ${el.verse.text}`).join("\n"));

      await bot.editMessageText("Файл успешно отправлен! ✅", { chat_id: chatId, message_id: statusMessageId });
    } catch (err) {
      console.error(err);
      await bot.editMessageText("Пожалуйста, укажите точную суру, начиная с 1 и заканчивая 114.", {
        chat_id: chatId,
        message_id: statusMessageId,
      });
    }
  });

  //only ayah text command
  bot.onText(/\/read_surah_(\d+)_ayah_(\d+)(?:_to_(\d+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const surah = Number(match[1]);
    const ayahStart = Number(match[2]);
    const ayahEnd = Number(match[3]) || ayahStart;

    const { chunks, header } = await getSurahText(surah, ayahStart, ayahEnd);

    await bot.sendMessage(chatId, header, { parse_mode: "Markdown" });
    for (const chunk of chunks) {
      await bot.sendMessage(chatId, chunk);
    }
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === "/listen_surah") {
      bot.sendMessage(
        chatId,
        "Пожалуйста, предоставьте более подробную информацию: укажите номер суры и номера аятов. Пример: /listen_surah_1_ayah_1_to_7 или /listen_surah_1_ayah_1"
      );
    }
    if (msg.text === "/read_surah") {
      bot.sendMessage(
        chatId,
        "Пожалуйста, предоставьте более подробную информацию: укажите номер суры и номера аятов. Пример: /read_surah_1_ayah_1_to_7 или /read_surah_1_ayah_1"
      );
    }
  });

  // get_name command
  bot.onText(/\/get_name(\s+(\d+))?/, async (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    // const isSubscribed = await checkUserSubscription(bot, userId);

    // if (!isSubscribed) {
    //   return bot.sendMessage(chatId, botTexts.join_us + process.env.CHANNEL_ID);
    // }
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
