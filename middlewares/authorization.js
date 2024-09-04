const botText = require("../data/botText");
const userContexts = require("../bot/context");
const UserModel = require("../models/UserModel");
const { unauthorizedCommands, commands } = require("../options");
const { setNewUser } = require("../services/user.service");
require("dotenv").config();

const whiteList = JSON.parse(process.env.WHITE_LIST);

const authorization = (bot) => {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    let condidate = await UserModel.findOne({ tgId: senderId }).populate("checkYourSelf");

    if (!condidate) {
      await setNewUser(msg);
    }

    userContexts[chatId] = { currentUser: condidate };

    if (unauthorizedCommands.some((cmd) => cmd.command === msg.text)) {
      bot.setMyCommands(unauthorizedCommands);
      return;
    }

    if (!whiteList.includes(senderId)) {
      await bot.sendMessage(chatId, botText.you_cant_use);
      return;
    }

    bot.setMyCommands(commands);
    bot.emit("authorized_message", msg);
  });
};

module.exports = authorization;
