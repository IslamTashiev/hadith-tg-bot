const botText = require("../data/botText");
require("dotenv").config();

const whiteList = JSON.parse(process.env.WHITE_LIST);

const authorization = (bot) => {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    if (!whiteList.includes(senderId)) {
      await bot.sendMessage(chatId, botText.you_cant_use);
      return;
    }

    bot.emit("authorized_message", msg);
  });
};

module.exports = authorization;
