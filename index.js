const configureData = require("./services/data.service");
const express = require("express");
const path = require("path");
(() => {
  try {
    const mongoose = require("mongoose");
    const { everyDaySchedule, everyFridaySchedule, resetUserAttempts } = require("./services/schedule.service");
    require("dotenv").config();

    require("./bot/instance");
    // require("./bot/commands");
    require("./bot/emits");
    require("./bot/callbacks");
    require("./server/index");

    (async () => {
      const MONGO_URI = process.env.MONGO_URI;
      await mongoose.connect(MONGO_URI);
      console.log("MongoDB connected...");

      await everyDaySchedule();
      await everyFridaySchedule();
      await resetUserAttempts();

      console.log("schedule started...");

      configureData();

      const app = express();
      app.listen(55);

      app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "client", "index.html"));
      });
    })();
  } catch (err) {
    console.log("Error: ", err);
  }
})();
