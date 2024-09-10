const { commands } = require("../options");
require("dotenv").config();

const whiteList = JSON.parse(process.env.WHITE_LIST);

module.exports.checkAuth = (msg) => {
  const senderId = msg.from.id;
  const currentCommand = commands.find((cmd) => cmd.command === msg.text);

  if (!whiteList.includes(senderId) && currentCommand?.private) {
    return true;
  }
};
