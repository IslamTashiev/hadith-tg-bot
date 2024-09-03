const userContexts = require("../bot/context");
const UserModel = require("../models/UserModel");

const setNewUser = async (msg) => {
  const condidate = await UserModel.findOne({ tgId: msg.from.id });

  if (!condidate) {
    const data = {
      lastName: msg.from.last_name,
      firstName: msg.from.first_name,
      username: msg.from.username,
      tgId: msg.from.id,
      chatId: msg.from.id,
    };
    const newUser = new UserModel(data);
    const createdUser = await newUser.save();
    userContexts[msg.from.id] = { currentUser: createdUser };
  }
  userContexts[msg.from.id] = { currentUser: condidate };
};

module.exports = { setNewUser };
