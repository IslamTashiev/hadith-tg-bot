(() => {
  try {
    const mongoose = require("mongoose");
    const { everyDaySchedule, everyFridaySchedule, resetUserAttempts } = require("./services/schedule.service");
    require("dotenv").config();

    require("./bot/instance");
    require("./bot/commands");
    require("./bot/emits");
    require("./bot/callbacks");

    (async () => {
      const MONGO_URI = process.env.MONGO_URI;
      await mongoose.connect(MONGO_URI);
      console.log("MongoDB connected...");

      await everyDaySchedule();
      await everyFridaySchedule();
      await resetUserAttempts();

      console.log("schedule started...");
    })();
  } catch (err) {
    console.log("Error: ", err.message);
  }
})();
