const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const { handlePrivateCommands } = require("./commands");
const { handlePublicCommands } = require("./publicCommands");
const { unauthorizedCommands } = require("../options");

const token = process.env.TELEGRAM_TOKEN;
const whiteList = JSON.parse(process.env.WHITE_LIST);

const bot = new TelegramBot(token, { polling: true });

let messageListener;

messageListener = (msg) => {
  const senderId = msg.from.id;
  handlePublicCommands(bot, msg);

  if (whiteList.includes(senderId)) {
    handlePrivateCommands(bot, msg);
  }

  bot.removeListener("message", messageListener);
};

bot.on("message", messageListener);
bot.setMyCommands(unauthorizedCommands);

module.exports = bot;
