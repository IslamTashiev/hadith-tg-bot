const ffmpeg = require("fluent-ffmpeg");
const { PassThrough } = require("stream");
const fs = require("fs");

const mergeMultipleAudioFiles = (inputFiles) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    const bufferStream = new PassThrough();

    inputFiles.forEach((file) => {
      command.input(file);
    });

    let buffers = [];

    command
      .on("end", () => {
        const audioBuffer = Buffer.concat(buffers);
        resolve(audioBuffer);
      })
      .on("error", (err) => {
        reject(err);
      })
      .complexFilter([
        {
          filter: "concat",
          options: {
            n: inputFiles.length,
            v: 0,
            a: 1,
          },
        },
      ])
      .audioCodec("libmp3lame")
      .format("mp3")
      .pipe(bufferStream, { end: true });

    bufferStream.on("data", (chunk) => {
      buffers.push(chunk);
    });

    bufferStream.on("error", (err) => {
      reject(err);
    });
  });
};

const getSurahText = async (surahNumber, startAyah, endAyah, ln = "text") => {
  const mainPath = "quran/yasser_by_ayah";
  const surahPath = `${mainPath}/${surahNumber.toString().padStart(3, "0")}/info.json`;
  const bismillahPath = `${mainPath}/b/info.json`;

  try {
    await fs.promises.access(surahPath);
    const surahInfoJson = fs.readFileSync(surahPath, "utf8");
    const surahInfo = JSON.parse(surahInfoJson);
    const bismillahInfoJson = fs.readFileSync(bismillahPath, "utf8");
    const bismillahInfo = JSON.parse(bismillahInfoJson);
    const surahMetadata = surahInfo.metadata;

    let ayahsText = `${bismillahInfo[ln]}\n\n`;
    const header = `Сура *«${surahMetadata.translation}»*, аяты ${startAyah}-${endAyah}\nОбщее количество аятов: ${surahMetadata.total_verses}`;
    const chunks = [];

    for (let i = startAyah; i <= endAyah; i++) {
      const ayah = surahInfo.ayahs[i - 1];
      ayahsText += `${ayah.verse}. ${ayah[ln]}\n${endAyah === i ? "\n" : ""}`;
    }
    for (let i = 0; i < ayahsText.length; i += 4096) {
      chunks.push(ayahsText.substring(i, i + 4096));
    }

    return { chunks, header };
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = {
  mergeMultipleAudioFiles,
  getSurahText,
};
