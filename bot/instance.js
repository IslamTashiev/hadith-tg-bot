const TelegramBot = require("node-telegram-bot-api");
const authorization = require("../middlewares/authorization");
const { commands } = require("../options");
require("dotenv").config();

const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, { polling: true });

authorization(bot);
bot.setMyCommands(commands);

module.exports = bot;
