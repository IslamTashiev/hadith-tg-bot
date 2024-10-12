const { Router } = require("express");
const { getChapters, getSurah, getVerse } = require("./services");

const router = new Router();

router.get("/chapters", getChapters);
router.get("/surah/:id", getSurah);
router.get("/catalog", getVerse);

module.exports = router;
