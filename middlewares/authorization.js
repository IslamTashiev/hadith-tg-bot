const botText = require("../data/botText");
const userContexts = require("../bot/context");
const UserModel = require("../models/UserModel");
require("dotenv").config();

const whiteList = JSON.parse(process.env.WHITE_LIST);

const authorization = (bot) => {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // if (!condidate) {
    //   await bot.sendMessage(chatId, "Вы не зарегистрированы, для регистрации воспользуйтесь командой /start");
    //   return;
    // }

    if (!whiteList.includes(senderId)) {
      await bot.sendMessage(chatId, botText.you_cant_use);
      return;
    }

    bot.emit("authorized_message", msg);
    const condidate = await UserModel.findOne({ tgId: senderId }).populate("checkYourSelf");
    userContexts[chatId] = { currentUser: condidate };
  });
};

module.exports = authorization;
