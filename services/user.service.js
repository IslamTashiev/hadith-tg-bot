const userContexts = require("../bot/context");
const bot = require("../bot/instance");
const CheckYourSeflModel = require("../models/CheckYourSeflModel");
const UserModel = require("../models/UserModel");

const setNewUser = async (msg) => {
  const condidate = await UserModel.findOne({ tgId: msg.from.id });

  if (!condidate) {
    const attempt = new CheckYourSeflModel({});
    const createdAttempt = await attempt.save();
    const userProfilePhotos = await bot.getUserProfilePhotos(msg.from.id);
    let userAvatar = "public/default_user.png";

    if (userProfilePhotos.total_count > 0) {
      const fileId = userProfilePhotos.photos[0][0].file_id;
      const file = await bot.getFile(fileId);
      userAvatar = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.file_path}`;
    }

    const data = {
      lastName: msg.from.last_name,
      firstName: msg.from.first_name,
      username: msg.from.username,
      tgId: msg.from.id,
      chatId: msg.chat.id,
      checkYourSelf: createdAttempt._id,
      avatar: userAvatar,
    };
    const newUser = new UserModel(data);

    const createdUser = await newUser.save();
    userContexts[msg.from.id] = { currentUser: createdUser };
  }
  userContexts[msg.from.id] = { currentUser: condidate };
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

module.exports = { setNewUser, getTopUsers, getTopUsersMarkup };
