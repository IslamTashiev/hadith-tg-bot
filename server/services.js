const fs = require("fs");

const getChapters = async (req, res) => {
  const chapters = await fs.promises.readFile("static/chapters.json");
  res.json(JSON.parse(chapters));
};
const getSurah = async (req, res) => {
  const { id } = req.params;
  const mainPath = "quran/yasser_by_ayah";
  const pathToSurah = `${mainPath}/${id.padStart(3, "0")}`;
  const pathToSurahInfo = `${pathToSurah}/info.json`;

  const surahInfoJson = await fs.promises.readFile(pathToSurahInfo);
  const surahInfo = JSON.parse(surahInfoJson);
  const surahVerses = surahInfo.ayahs.map((ayah) => ({
    ...ayah,
    path: `${pathToSurah}/${ayah.verse.toString().padStart(3, "0")}.mp3`,
  }));

  res.json({ ...surahInfo, ayahs: surahVerses });
};

const getVerse = async (req, res) => {
  const { path } = req.query;

  try {
    await fs.promises.access(path);
    const stat = fs.statSync(path);
    const fileSize = stat.size;
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "audio/mpeg",
    };

    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  } catch (err) {
    console.log(err.message);
    res.json(err);
  }
};

module.exports = {
  getChapters,
  getSurah,
  getVerse,
};
