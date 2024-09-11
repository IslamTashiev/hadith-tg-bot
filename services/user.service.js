const { default: axios } = require("axios");
const userContexts = require("../bot/context");
const bot = require("../bot/instance");
const CheckYourSeflModel = require("../models/CheckYourSeflModel");
const QuestionAttempts = require("../models/QuestionAttempts");
const UserModel = require("../models/UserModel");
const { commands } = require("../options");
const fs = require("fs");
require("dotenv").config();

const setNewUser = async (bot, msg) => {
  const condidate = await UserModel.findOne({ tgId: msg.from.id });

  if (!condidate) {
    const attempt = new CheckYourSeflModel({});
    const createdAttempt = await attempt.save();
    const questionAttempts = new QuestionAttempts({});
    const createdQuestionAttempt = await questionAttempts.save();
    const userProfilePhotos = await bot?.getUserProfilePhotos(msg.from.id);
    let userAvatar = "public/default_user.png";

    if (userProfilePhotos.total_count > 0) {
      const fileId = userProfilePhotos.photos[0][0].file_id;
      const file = await bot.getFile(fileId);
      const avatarPath = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.file_path}`;
      const response = await axios.get(avatarPath, { responseType: "arraybuffer" });
      const uploadedAvatarPath = `useravatars/${fileId}.png`;
      fs.mkdir("useravatars", { recursive: true }, (err) => (err ? console.error(err) : null));
      const writer = fs.createWriteStream(uploadedAvatarPath);
      writer.write(response.data);
      userAvatar = uploadedAvatarPath;
    }

    const data = {
      lastName: msg.from.last_name,
      firstName: msg.from.first_name,
      username: msg.from.username,
      tgId: msg.from.id,
      chatId: msg.chat.id,
      checkYourSelf: createdAttempt._id,
      questionAttempts: createdQuestionAttempt._id,
      avatar: userAvatar,
    };
    const newUser = new UserModel(data);

    const createdUser = await newUser.save();
    userContexts[msg.from.id] = { currentUser: createdUser };
  }
  userContexts[msg.from.id] = { currentUser: condidate };
};

const checkUserSubscription = async (bot, userId) => {
  try {
    const channelId = process.env.CHANNEL_ID;
    const chatMember = await bot.getChatMember(channelId, userId);

    const status = chatMember.status;

    if (status === "member" || status === "administrator" || status === "creator") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Ошибка при проверке подписки:", error.message);
    return false;
  }
};

const getTopUsers = async () => {
  try {
    const users = await UserModel.find().sort({ totalScore: -1 }).exec();
    return users;
  } catch (err) {
    console.log(err.message);
  }
};

const getTopUsersMarkup = (topUsers) => {
  return topUsers.reduce((acc, el, index) => {
    let name = `${el?.firstName} ${el?.lastName}`.replace(/none/g, "");

    return acc + `${index + 1}. ${name} @${el.username}  |  ${el.totalScore} очков\n`;
  }, "");
};

const userCommands = (userId) => {
  const whiteList = JSON.parse(process.env.WHITE_LIST);
  const accessCommands = !whiteList.includes(userId) ? commands.filter((cmd) => !cmd.private) : commands;
  return accessCommands.map((cmd) => `${cmd.command} - ${cmd.description}`).join("\n");
};

module.exports = { setNewUser, getTopUsers, getTopUsersMarkup, userCommands, checkUserSubscription };
