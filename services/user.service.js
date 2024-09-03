const userContexts = require("../bot/context");
const CheckYourSeflModel = require("../models/CheckYourSeflModel");
const UserModel = require("../models/UserModel");

const setNewUser = async (msg) => {
  const condidate = await UserModel.findOne({ tgId: msg.from.id });

  if (!condidate) {
    const attempt = new CheckYourSeflModel({});
    const createdAttempt = await attempt.save();

    const data = {
      lastName: msg.from.last_name,
      firstName: msg.from.first_name,
      username: msg.from.username,
      tgId: msg.from.id,
      chatId: msg.from.id,
      checkYourSelf: createdAttempt._id,
    };
    const newUser = new UserModel(data);

    const createdUser = await newUser.save();
    userContexts[msg.from.id] = { currentUser: createdUser };
  }
  userContexts[msg.from.id] = { currentUser: condidate };
};

const getTopUsers = async () => {
  try {
    const users = await UserModel.find({ totalScore: -1 }).exec();
    return users;
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = { setNewUser, getTopUsers };
