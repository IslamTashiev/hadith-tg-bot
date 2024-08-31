const { IgApiClient, IgCheckpointError } = require("instagram-private-api");
const fs = require("fs");
const path = require("path");
const { readFile } = require("fs").promises;
require("dotenv").config();

class InstagramController {
  constructor(username, password) {
    this.username = username;
    this.password = password;
    this.ig = new IgApiClient();
  }

  async login() {
    try {
      await this.loadState();
    } catch (e) {
      console.log("No saved state found. Proceeding with new login.");
    }

    try {
      this.ig.state.generateDevice(this.username);
      await this.ig.simulate.preLoginFlow();
      const loggedInUser = await this.ig.account.login(this.username, this.password);
      process.nextTick(async () => await this.ig.simulate.postLoginFlow());

      await this.saveState();

      return loggedInUser;
    } catch (e) {
      if (e instanceof IgCheckpointError) {
        console.log("Checkpoint required. Processing...");
        await this.ig.challenge.auto(true);
        await this.saveState();
      } else {
        console.error(e);
      }
    }
  }

  async publishPhoto(photoPath, caption) {
    try {
      const photo = await readFile(photoPath);
      await this.ig.publish.photo({
        file: photo,
        caption: caption,
      });
      console.log("Photo published successfully");
    } catch (e) {
      console.error("Failed to publish photo:", e);
    }
  }

  async saveState() {
    const state = await this.ig.state.serialize();
    delete state.constants;
    fs.writeFileSync("ig_state.json", JSON.stringify(state));
  }

  async loadState() {
    const state = JSON.parse(fs.readFileSync("ig_state.json", "utf-8"));
    await this.ig.state.deserialize(state);
  }
}

const instagramController = new InstagramController(process.env.IG_USERNAME, process.env.IG_PASSWORD);

module.exports = instagramController;
