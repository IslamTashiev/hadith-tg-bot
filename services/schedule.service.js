const cron = require("node-cron");
const { getSettings } = require("./setting.service");
const { createHadithPhoto, createHadithPhotoByBook } = require("./hadith.service");
const bot = require("../bot/instance");
const fs = require("fs");
const { postPhoto } = require("./instagram.service");
const CheckYourSeflModel = require("../models/CheckYourSeflModel");
const UserModel = require("../models/UserModel");
const botText = require("../data/botText");
const QuestionAttempts = require("../models/QuestionAttempts");
require("dotenv/config");

const channelId = process.env.CHANNEL_ID;

const everyDaySchedule = async () => {
  const settings = await getSettings();
  const dailyTime = settings.time_of_every_day_hadith;
  const times = dailyTime.split(":");

  if (!settings.every_day_hadith) return;

  const schedule = cron.schedule(
    `${times[1]} ${times[0]} * * *`,
    async () => {
      try {
        await createHadithPhoto();
        const photoStream = fs.createReadStream("patterns/output.png");
        const fileOptions = { filename: "customfilename", contentType: "application/octet-stream" };

        await bot.sendPhoto(channelId, photoStream, {}, fileOptions);
        await postPhoto();
      } catch (err) {
        console.log("Error in everyDaySchedule: ", err.message);
      }
    },
    { scheduled: true }
  );

  return schedule;
};

const everyFridaySchedule = async () => {
  const settings = await getSettings();
  const dailyTime = settings.time_of_every_friday_hadith;
  const times = dailyTime.split(":");

  if (!settings.every_friday_hadith) return;

  const schedule = cron.schedule(
    `0 0 * * 5`,
    async () => {
      await createHadithPhotoByBook(11);
      const photoStream = fs.createReadStream("patterns/output.png");
      const fileOptions = { filename: "customfilename", contentType: "application/octet-stream" };

      await bot.sendPhoto(channelId, photoStream, {}, fileOptions);
    },
    { scheduled: true }
  );

  return schedule;
};

const resetUserAttempts = async () => {
  const schedule = cron.schedule(
    "0 0 * * *",
    async () => {
      await CheckYourSeflModel.updateMany({ usedAttempts: 0 });
      await QuestionAttempts.updateMany({ usedAttempts: 0 });
      // const users = await UserModel.find({});
      // users.forEach(async (user) => {
      //   await bot.sendMessage(user.tgId, botText.counter_reset);
      // });
    },
    { scheduled: true }
  );
  return schedule;
};

module.exports = { everyDaySchedule, everyFridaySchedule, resetUserAttempts };
