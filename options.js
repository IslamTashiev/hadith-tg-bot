const sections = require("./data/sections");

const commands = [
  { command: "/start", description: "Начать работу с ботом", private: false },
  { command: "/sections", description: "Все секции", private: true },
  { command: "/send_hadith", description: "Отправить случайный хадис", private: true },
  { command: "/send_photo", description: "Отправить слуйчайный хадис картинкой", private: true },
  { command: "/send_voice", description: "Отправить аудио хадис", private: true },
  { command: "/set_pattern", description: "Загрузить шаблон", private: true },
  { command: "/remove_pattern", description: "Удалить шаблон", private: true },
  { command: "/confirm_hadith", description: "Подтвердить хадис", private: true },
  { command: "/check_your_self", description: "Проверь свои знания", private: false },
  { command: "/tops", description: "Показать топы", private: false },
  { command: "/hadith", description: "Получить хадис", private: false },
  { command: "/question", description: "Ежедневная викторина", private: false },
  { command: "/get_name", description: "Получить 1 из 99 имен Аллаха", private: false },
  { command: "/surah", description: "Получить суру", private: false },
  { command: "/listen_surah", description: "Получить суру с уточненным аятом.", private: false },
  { command: "/read_surah", description: "Получить суру с уточненным аятом в виде текста.", private: false },
  { command: "/quran", description: "Список всех сур.", private: false },
  { command: "/commands", description: "Доступные команды", private: false },
];

const hadithMessageOptions = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Опубликовать ✅", callback_data: "send_to_channel" },
        { text: "Пропустить ❌", callback_data: "skip" },
      ],
    ],
    remove_keyboard: true,
  },
};

const hadithPhotoOptions = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Опубликовать ✅", callback_data: "send_to_channel_photo" },
        { text: "Пропустить ❌", callback_data: "skip_photo" },
      ],
    ],
  },
};

const sectionsOption = () => ({
  reply_markup: {
    keyboard: Object.values(sections).map((item, index) => [{ text: item, callback_data: index }]),
    one_time_keyboard: true,
  },
});

const chaptersOption = (chapters) => ({
  reply_markup: {
    keyboard: chapters.map((item, index) => [
      { text: `${item.translation} (${item.id}:${item.total_verses})`, callback_data: index },
    ]),
    one_time_keyboard: true,
  },
});

const everyDayHadithSettings = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Включен", callback_data: "every_day_hadith_on" },
        { text: "Выключен", callback_data: "every_day_hadith_off" },
      ],
    ],
  },
};
const everyFridayHadithSettings = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Включен", callback_data: "every_friday_hadith_on" },
        { text: "Выключен", callback_data: "every_friday_hadith_off" },
      ],
    ],
  },
};
const confirmHadithOption = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Изменить", callback_data: "edit_hadith" },
        { text: "Отменить", callback_data: "unconfirm_hadith" },
      ],
      [{ text: "Подтвердить", callback_data: "confirm_hadith" }],
    ],
  },
};

const cancelEdit = {
  reply_markup: {
    inline_keyboard: [[{ text: "Отменить редактирование", callback_data: "cancel_edit_hadith" }]],
  },
};

const settingsKeyboard = async (settings) => {
  // const settings = await getSettings();
  return {
    reply_markup: {
      keyboard: Object.keys(settings).map((el) => [{ text: el }]),
      one_time_keyboard: true,
    },
  };
};

const dificultLevels = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "Легкий 45", callback_data: "dificult_1" }],
      [{ text: "Средний 60", callback_data: "dificult_2" }],
      [{ text: "Сложный 100", callback_data: "dificult_3" }],
    ],
  },
};

const ready = {
  reply_markup: {
    inline_keyboard: [[{ text: "Готов", callback_data: "ready" }]],
  },
};

const answers = (answers) => ({
  reply_markup: {
    inline_keyboard: answers.map((elem, index) => [
      {
        text: elem,
        callback_data: "answer_" + index,
      },
    ]),
  },
});

module.exports = {
  commands,
  hadithMessageOptions,
  sectionsOption,
  hadithPhotoOptions,
  everyDayHadithSettings,
  everyFridayHadithSettings,
  confirmHadithOption,
  cancelEdit,
  settingsKeyboard,
  dificultLevels,
  ready,
  answers,
  chaptersOption,
};
