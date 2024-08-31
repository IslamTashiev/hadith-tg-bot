const bot = require("../bot/instance");
const path = require("path");
const fs = require("fs").promises;

const settingsPath = path.join(__dirname, "../data", "settings.json");

// Кэш настроек
let settingsCache = null;

// Функция для получения настроек из кэша или из файла
const getSettings = async () => {
  if (!settingsCache) {
    try {
      const settingsData = await fs.readFile(settingsPath, { encoding: "utf-8" });
      settingsCache = JSON.parse(settingsData); // Парсим JSON в объект и сохраняем в кэш
    } catch (error) {
      console.error("Ошибка при чтении файла настроек:", error);
      settingsCache = {}; // Возвращаем пустой объект в случае ошибки
    }
  }
  return settingsCache;
};

// Функция для сохранения настроек в файл
const saveSettings = async () => {
  try {
    await fs.writeFile(settingsPath, JSON.stringify(settingsCache, null, 2)); // Сохранение с форматированием
    console.log("Настройки успешно сохранены.");
  } catch (error) {
    console.error("Ошибка при записи файла настроек:", error);
  }
};

// Функция для изменения паттерна
const changePattern = async (patternPath) => {
  const settings = await getSettings();
  settings.default_pattern = patternPath;
  await saveSettings(); // Сохранение всех настроек в файл
};

// Функция для изменения состояния ежедневного хадиса
const changeEveryDayHadith = async (state) => {
  const settings = await getSettings();
  settings.every_day_hadith = state;
  await saveSettings(); // Сохранение всех настроек в файл
};

// Функция для изменения времени ежедневного хадиса
const changeEveryDayHadithTime = async (time) => {
  const settings = await getSettings();
  settings.time_of_every_day_hadith = time;
  await saveSettings(); // Сохранение всех настроек в файл
};

// Функция для изменения состояния ежепятничного хадиса
const changeEveryFridayHadith = async (state) => {
  const settings = await getSettings();
  settings.every_friday_hadith = state;
  await saveSettings(); // Сохранение всех настроек в файл
};

// Функция для изменения времени ежепятничного хадиса и сохранения всех настроек
const changeEveryFridaysHadithTime = async (time) => {
  const settings = await getSettings();
  settings.time_of_every_friday_hadith = time;
  await saveSettings(); // Сохранение всех настроек в файл
};

// Функция для создания разметки настроек
const settingsMarkup = async () => {
  const settings = await getSettings();
  return `\n<i>Шаблон:</i> <code>${settings.default_pattern}</code>\n<i>Ежедневный хадис:</i> <code>${settings.every_day_hadith}</code>\n<i>Время ежедневного хадиса:</i> <code>${settings.time_of_every_day_hadith}</code>\n<i>Жума хадис:</i> <code>${settings.every_friday_hadith}</code>\n<i>Время жума хадиса:</i> <code>${settings.time_of_every_friday_hadith}</code>`;
};

module.exports = {
  changePattern,
  changeEveryDayHadith,
  changeEveryDayHadithTime,
  changeEveryFridayHadith,
  changeEveryFridaysHadithTime,
  settingsMarkup,
  getSettings,
};
