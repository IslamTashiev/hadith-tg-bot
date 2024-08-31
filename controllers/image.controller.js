const sharp = require("sharp");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { default: axios } = require("axios");
const fs = require("fs");
const PatternModel = require("../models/PatternModel");

class ImageController {
  constructor(inputImagePath = "patterns/default-pattern.jpg", outputImagePath = "patterns/output.png") {
    this.inputImagePath = inputImagePath;
    this.outputImagePath = outputImagePath;
    this.registerLocalFont("public/AquawaxFxTrial-Regular.otf");
    // this.registerLocalFont("public/HelveticaNeueLTW1G-Md.otf");
  }

  wrapText(context, text, maxWidth) {
    const words = text.split(" ");
    let line = "";
    let lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    return lines;
  }

  async addTextToImage(text, title, withMark) {
    if (!fs.existsSync(this.inputImagePath)) {
      throw new Error(`Input file is missing: ${this.inputImagePath}`);
    }

    const image = sharp(this.inputImagePath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    const imgBuffer = await image.toBuffer();
    const img = await loadImage(imgBuffer);
    context.drawImage(img, 0, 0, width, height);

    const patterns = await PatternModel.find();
    const currentPattern = patterns.find((elem) => elem.filePath === this.inputImagePath);

    if (withMark) {
      const instMarkPath = `public/inst_mark_${currentPattern.textColor}.png`;
      const markImg = sharp(instMarkPath);
      const markMetaData = await markImg.metadata();

      const markScale = width * 0.35;
      const scaledMarkWidth = Math.round(markScale);
      const scaledMarkHeight = Math.round((scaledMarkWidth / markMetaData.width) * markMetaData.height);

      const markBuffer = await markImg.resize(scaledMarkWidth, scaledMarkHeight).toBuffer();
      const mark = await loadImage(markBuffer);

      context.drawImage(mark, width / 2 - scaledMarkWidth / 2, 40, scaledMarkWidth, scaledMarkHeight);
    }

    const fontSize = width / 25;
    const titleFontSize = width / 40;
    context.font = `bold ${fontSize}px "Aquawax"`;
    context.fillStyle = currentPattern.textColor ?? "black";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 4;
    context.shadowBlur = 4;
    context.shadowColor = "rgba(0, 0, 0, 0.25)";

    const lineHeight = fontSize * 1.2;
    const titleLineHeight = titleFontSize * 1.2;
    const maxWidth = width * 0.8;
    const lines = this.wrapText(context, text, maxWidth, lineHeight);
    const titleLines = this.wrapText(context, title, maxWidth, lineHeight);

    const textHeight = lines.length * lineHeight;
    const startY = height / 2 - textHeight / 2;

    lines.forEach((line, index) => {
      context.fillText(line, width / 2, startY + index * lineHeight);
    });
    context.font = `regular ${titleFontSize}px "Aquawax"`;
    titleLines.forEach((line, index) => {
      context.fillText(line, width / 2, height - 100 + index * titleLineHeight);
    });

    const outputBuffer = canvas.toBuffer("image/png");
    await sharp(outputBuffer).toFile(this.outputImagePath);
  }

  registerLocalFont(fontPath) {
    if (fs.existsSync(fontPath)) {
      try {
        registerFont(fontPath, { family: "Aquawax" });
      } catch (err) {
        console.error("Ошибка при регистрации шрифта:", err);
      }
    } else {
      console.error("Шрифт не найден:", fontPath);
    }
  }

  static async saveImage(fileUrl, filePath) {
    return new Promise((resolve, reject) => {
      axios({
        url: fileUrl,
        responseType: "stream",
      })
        .then((response) => {
          const writer = fs.createWriteStream(filePath);
          writer.on("finish", () => resolve(writer));
          writer.on("error", (error) => {
            fs.unlink(filePath, () => reject(error));
          });
          response.data.pipe(writer);
          // writer.on("close", () => console.log("Stram closed"));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  static async getImageThone(imagePath) {
    const sharpBuffer = await sharp(imagePath).grayscale().raw().toBuffer();
    const { width, height } = await sharp(imagePath).metadata();

    const totalPixels = width * height;
    let totalLuminance = 0;

    for (let i = 0; i < sharpBuffer.length; i++) {
      totalLuminance += sharpBuffer[i];
    }

    const averageLuminance = totalLuminance / totalPixels;

    if (averageLuminance < 85) {
      return "dark";
    } else if (averageLuminance < 170) {
      return "middle";
    }
    return "light";
  }
}

module.exports = ImageController;
