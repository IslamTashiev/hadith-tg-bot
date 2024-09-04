const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { default: axios } = require("axios");

class TTSController {
  async getToken() {
    const key = JSON.parse(fs.readFileSync("googleKeys.json", "utf-8"));
    const token = jwt.sign(
      {
        iss: key.client_email,
        scope: "https://www.googleapis.com/auth/cloud-platform",
        aud: "https://www.googleapis.com/oauth2/v4/token",
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        lat: Math.floor(Date.now() / 1000),
      },
      key.private_key,
      { algorithm: "RS256" }
    );

    const response = await axios.post("https://www.googleapis.com/oauth2/v4/token", {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: token,
    });

    return response.data.access_token;
  }

  async tts(text, fileName) {
    const url = "https://texttospeech.googleapis.com/v1/text:synthesize";
    const data = {
      input: { text },
      voice: {
        languageCode: "ru-RU",
        name: "ru-RU-Wavenet-B",
      },
      audioConfig: { audioEncoding: "MP3", pitch: -1.8, speakingRate: 1 },
    };
    const accessToken = await this.getToken();
    const response = await axios({
      url,
      method: "POST",
      data,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const audioBuffer = Buffer.from(response.data.audioContent, "base64");

    const dirPath = path.join(__dirname, "..", "audio");
    const filePath = path.join(dirPath, `${fileName ?? "output"}.mp3`);

    try {
      await fs.promises.mkdir(dirPath, { recursive: true });

      await fs.promises.writeFile(filePath, audioBuffer);
      console.log(`Audio file saved successfully at ${filePath}`);
    } catch (error) {
      console.error("Error saving audio file:", error.message);
    }
  }
}

module.exports = TTSController;
