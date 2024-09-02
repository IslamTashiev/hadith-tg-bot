const { default: OpenAI } = require("openai");
const fs = require("fs");
require("dotenv").config();

class OpenAIController {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey: apiKey });
    this.model = "gpt-3.5-turbo";
  }

  async compareHadith(hadithText, transcribedText) {
    const messagesPath = "data/messages.json";

    const jsonMessages = await fs.promises.readFile(messagesPath);
    const messages = JSON.parse(jsonMessages);
    const request = [...messages, { role: "user", content: `${hadithText}\n\n${transcribedText}` }];

    const chatCompletion = await this.openai.chat.completions.create({ model: this.model, messages: request });

    const response = chatCompletion.choices[0].message;
    await fs.promises.writeFile(messagesPath, JSON.stringify([...request, response]));

    return response;
  }

  async transcribe(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const response = await this.openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
    });
    return response;
  }
}

const openaiController = new OpenAIController(process.env.OPENAI_API_KEY);

module.exports = openaiController;
