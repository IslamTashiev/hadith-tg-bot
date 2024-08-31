const sections = require("./data/sections");
const { getSettings } = require("./services/setting.service");

const commands = [
  { command: "/start", description: "Начать работу с ботом" },
  // { command: "/set_time", description: "Указать время отправки ежедневного хадиса" },
  { command: "/sections", description: "Все секции" },
  { command: "/send_hadith", description: "Отправить случайный хадис" },
  { command: "/send_photo", description: "Отправить слуйчайный хадис картинкой" },
  { command: "/send_voice", description: "Отправить аудио хадис" },
  { command: "/set_pattern", description: "Загрузить шаблон" },
  { command: "/remove_pattern", description: "Удалить шаблон" },
  // { command: "/settings", description: "Настройки" },
  { command: "/confirm_hadith", description: "Подтвердить хадис" },
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
};
