const ffmpeg = require("fluent-ffmpeg");
const { PassThrough } = require("stream");
const fs = require("fs");
const NodeID3 = require("node-id3");

const mergeMultipleAudioFiles = (inputFiles, surahMetadata) => {
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
        const tags = {
          title: `${surahMetadata.transliteration} ayahs ${surahMetadata.verses}`,
          artist: "Yasser Al Dossari",
          album: "Quran",
        };
        const taggedAudioBuffer = NodeID3.write(tags, audioBuffer);
        resolve(taggedAudioBuffer);
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

const getSurahAudio = async (surahNumber, startAyah, endAyah, changeStatus) => {
  const mainPath = "quran/yasser_by_ayah";
  const surahPath = `${mainPath}/${surahNumber.toString().padStart(3, "0")}`;
  const surahText = await getSurahText(surahNumber, startAyah, endAyah, "text");
  const bismillahPath = `${mainPath}/b/b.mp3`;

  try {
    await changeStatus("🔍: проверка файлов...");

    await fs.promises.access(surahPath);
    const surahInfoJson = fs.readFileSync(`${surahPath}/info.json`, "utf8");
    const surahInfo = JSON.parse(surahInfoJson);
    const surahMetadata = { ...surahInfo.metadata, verses: `${startAyah}-${endAyah}` };

    if (surahMetadata.total_verses < endAyah || startAyah <= 0) {
      await changeStatus(
        `Пожалуйста, укажите корректный аят суры - *${surahInfo.metadata.translation}*, начиная с 1 до ${surahInfo.metadata.total_verses}`
      );
      return { errors: true };
    }

    await changeStatus("📂: подготовка файлов...");

    let ayahs = surahNumber == 1 && startAyah == 1 ? [] : [bismillahPath];

    for (let i = startAyah; i <= endAyah; i++) {
      const ayahPath = `${surahPath}/${i.toString().padStart(3, "0")}.mp3`;
      try {
        await fs.promises.access(ayahPath);
        ayahs.push(ayahPath);
      } catch (err) {
        console.log(err.message);
      }
    }

    await changeStatus("🔄: слияние файлов...");

    const ayahsBuffer =
      endAyah === surahMetadata && startAyah === 1
        ? await fs.promises.readFile(`quran/yasser/quran_${surah}.mp3`)
        : await mergeMultipleAudioFiles(
            ayahs.map((el) => el),
            surahMetadata
          );

    await changeStatus("✈️: отправка файла...");

    return { ayahsBuffer, ...surahText };
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = {
  mergeMultipleAudioFiles,
  getSurahText,
  getSurahAudio,
};
