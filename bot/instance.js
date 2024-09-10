const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const { handlePrivateCommands } = require("./commands");
const { handlePublicCommands } = require("./publicCommands");
const { commands } = require("../options");

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

handlePublicCommands(bot, null);
handlePrivateCommands(bot, null);

const publicCommands = commands.filter((cmd) => !cmd.private);
bot.setMyCommands(publicCommands);

module.exports = bot;
