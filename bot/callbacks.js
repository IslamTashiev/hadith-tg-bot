const HadithModel = require("../models/HadithModel");
const PatternModel = require("../models/PatternModel");
const { hadithPhotoOptions, hadithMessageOptions, cancelEdit } = require("../options");
const { createHadithPhoto, infoMarkup, getHadith, getHadithByBook } = require("../services/hadith.service");
const userContexts = require("./context");
const bot = require("./instance");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const botText = require("../data/botText");
require("dotenv/config");

const channelId = process.env.CHANNEL_ID;

bot.on("callback_query", async (msg) => {
  const data = msg.data;
  const chatId = msg.message.chat.id;
  const messageId = msg.message.message_id;
  const hadith = userContexts[chatId]?.hadith;
  const context = userContexts[chatId];

  if (data === "send_to_channel") {
    await bot.sendMessage(channelId, msg.message.text);
    await bot.deleteMessage(chatId, messageId);
    await HadithModel.findByIdAndUpdate(hadith.id, { published: true });

    await bot.editMessageText(infoMarkup(context.hadith, "Опубликован"), {
      chat_id: chatId,
      message_id: context.message_id,
      parse_mode: "HTML",
      inline_message_id: context.message_id,
    });
  } else if (data === "skip") {
    await bot.deleteMessage(chatId, messageId);

    await bot.editMessageText(infoMarkup(context.hadith, "Пропущен"), {
      chat_id: chatId,
      message_id: context.message_id,
      parse_mode: "HTML",
      inline_message_id: context.message_id,
    });

    const hadith = context.sectionId ? await getHadithByBook(context.sectionId) : await getHadith();
    const hadithText = `${hadith.title}\n\n${hadith.text}`;
    const infoMessage = await bot.sendMessage(chatId, infoMarkup(hadith, "Не опубликован"), { parse_mode: "HTML" });
    userContexts[chatId] = { ...infoMessage, hadith, sectionId: context.sectionId ?? null };
    await bot.sendMessage(chatId, hadithText, hadithMessageOptions);
  }

  if (data === "send_to_channel_photo") {
    const photoStream = fs.createReadStream("patterns/output.png");
    const fileOptions = { filename: "customfilename", contentType: "application/octet-stream" };
    await bot.deleteMessage(chatId, messageId);
    await bot.sendPhoto(channelId, photoStream, {}, fileOptions);
    await HadithModel.findByIdAndUpdate(hadith.id, { published: true });

    await bot.editMessageText(infoMarkup(context.hadith, "Опубликован"), {
      chat_id: chatId,
      message_id: context.message_id,
      parse_mode: "HTML",
      inline_message_id: context.message_id,
    });
  } else if (data === "skip_photo") {
    await bot.deleteMessage(chatId, messageId);

    await bot.editMessageText(infoMarkup(context.hadith, "Пропущен"), {
      chat_id: chatId,
      message_id: context.message_id,
      parse_mode: "HTML",
      inline_message_id: context.message_id,
    });
  }

  if (data.startsWith("pattern:ASDF?")) {
    const patternFilePath = data.split(":ASDF?")[1];
    const hadith = await createHadithPhoto(patternFilePath);

    const photoStream = fs.createReadStream("patterns/output.png");
    const fileOptions = { filename: "customfilename", contentType: "application/octet-stream" };

    const infoMessage = await bot.sendMessage(chatId, infoMarkup(hadith, "Не опубликован"), { parse_mode: "HTML" });
    userContexts[chatId] = { ...infoMessage, hadith };
    await bot.sendPhoto(chatId, photoStream, hadithPhotoOptions, fileOptions);
  }

  if (data.startsWith("remove_pattern:ASDF?")) {
    try {
      const patternId = data.split(":ASDF?")[1];
      const patterns = await PatternModel.find();
      const condidate = patterns.find((el) => patternId === el._id.toJSON());

      const dirname = path.join(__dirname, "..", condidate.filePath);
      exec(`del /f ${dirname}`);

      await PatternModel.deleteOne({ filePath: condidate.filePath });

      await bot.deleteMessage(chatId, messageId);
      await bot.sendMessage(chatId, botText.pattern_deleted);
    } catch (err) {
      console.log("File not deleted: ", err);
      await bot.sendMessage(chatId, botText.pattern_not_deleted);
    }
  }

  if (data === "cancel_edit_hadith") {
    userContexts[chatId].edited = false;
    await bot.deleteMessage(chatId, messageId);
    await bot.sendMessage(chatId, botText.cancel_updates);
  }

  if (data === "edit_hadith") {
    await bot.copyMessage(chatId, chatId, messageId);
    await bot.sendMessage(chatId, botText.edit_text, cancelEdit);
    await bot.deleteMessage(chatId, messageId);

    userContexts[chatId].edited = true;
  } else if (data === "unconfirm_hadith") {
    if (hadith) {
      await HadithModel.findByIdAndUpdate(hadith.id, { confirmed: false });
      await bot.sendMessage(chatId, botText.cancel_hadith);
      await bot.deleteMessage(chatId, messageId);

      userContexts[chatId] = {};
    }
  } else if (data === "confirm_hadith") {
    if (hadith) {
      await HadithModel.findByIdAndUpdate(hadith.id, { confirmed: true });
      await bot.sendMessage(chatId, botText.confirm_hadith);
      await bot.deleteMessage(chatId, messageId);

      userContexts[chatId] = {};
    }
  }
});
