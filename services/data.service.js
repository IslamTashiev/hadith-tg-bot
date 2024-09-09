const fs = require("fs");
require("dotenv").config();

const directories = ["static", "useravatars", "voices", "audio"];
const staticFiles = [
  {
    path: "static/audio.json",
    data: {},
  },
  {
    path: "static/messages.json",
    data: [
      {
        role: "system",
        content:
          "Должен сравнивать хадисы по смыслу и совпадениям слов и выдавать статистику в формате 100/100 где первое значение смысла а второе совпадения.",
      },
    ],
  },
  {
    path: "static/questionContext.json",
    data: [
      {
        role: "system",
        content:
          "Придумай 1 подробный вопрос, с 4 вариантами ответа. Пиши в тэгах <query></query><answ></answ>, правильный ответ в <correct></correct>.",
      },
    ],
  },
];
const configFiles = [
  {
    path: "googleKeys.json",
    data: {
      type: process.env.GOOGLE_KEY_TYPE,
      project_id: process.env.GOOGLE_KEY_PROJECT_ID,
      private_key_id: process.env.GOOGLE_KEY_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_KEY_PRIVATE_KEY,
      client_email: process.env.GOOGLE_KEY_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_KEY_CLIENT_ID,
      auth_uri: process.env.GOOGLE_KEY_AUTH_URI,
      token_uri: process.env.GOOGLE_KEY_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_KEY_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_KEY_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_KEY_UNIVERSE_DOMAIN,
    },
  },
];

const createDirectories = () => {
  for (let i = 0; i < directories.length; i++) {
    const directory = directories[i];
    fs.mkdir(directory, { recursive: true });
  }
};
const createFiles = () => {
  for (let i = 0; i < staticFiles.length; i++) {
    const file = staticFiles[i];
    if (!fs.existsSync(file.path)) {
      fs.writeFile(file.path, JSON.stringify(file.data, null, 2), "utf-8", (err) => console.error(err));
      console.log("Создан файл: " + file.path);
    }
  }
};
const createConfigFiles = () => {
  for (let i = 0; i < configFiles.length; i++) {
    const file = configFiles[i];
    if (!fs.existsSync(file.path)) {
      fs.writeFile(file.path, JSON.stringify(file.data, null, 2), "utf-8", (err) => console.error(err));
      console.log("Создан файл: " + file.path);
    }
  }
};

const configureData = () => {
  createDirectories();
  createFiles();
  createConfigFiles();
};

module.exports = configureData;
