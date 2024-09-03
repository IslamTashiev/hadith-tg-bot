const { default: mongoose } = require("mongoose");
const CheckYourSeflModel = require("./CheckYourSeflModel");

const UserSchema = new mongoose.Schema({
  lastName: { type: String, required: true },
  firstName: { type: String, required: true },
  username: { type: String, required: true },
  tgId: { type: String, required: true },
  chatId: { type: String, required: true },
  checkYourSelf: { type: mongoose.Types.ObjectId, ref: "CheckYourSelf" },
});

UserSchema.pre("save", async (next) => {
  if (!this.checkYourSelf) {
    try {
      const defaultCheckYourSelf = await CheckYourSeflModel.create({});
      this.checkYourSelf = defaultCheckYourSelf._id;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
