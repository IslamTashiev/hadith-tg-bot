# Hadith Telegram Bot

Hadith Telegram Bot (hadith-tg-bot) — это Telegram-бот, созданный для распространения знаний о хадисах и исламских учениях. Бот предоставляет пользователям возможность получать случайные хадисы, участвовать в викторинах, проверять свои знания и изучать 99 имен Аллаха.

## Возможности

- **Получить хадис:** Пользователи могут запросить случайный хадис.
- **Проверить свои знания:** Участвуйте в викторинах и проверяйте свои знания.
- **Показать топы:** Узнайте лучших знатоков хадисов и исламских учений.
- **Получить имя Аллаха:** Получите одно из 99 имен Аллаха в случайном порядке или по номеру.
- **Ежедневная викторина:** Каждый день новая возможность проверить свои знания.
- **Доступные команды:** Узнайте доступные команды бота.

## Установка

1. Склонируйте репозиторий:

   ```bash
   git clone https://github.com/IslamTashiev/hadith-tg-bot.git
   cd hadith-tg-bot
   npm install
2. Создайте файл .env в корне проекта и добавьте следующие переменные:
   ```bash
   TELEGRAM_TOKEN=
   WHITE_LIST=
   MONGO_URI=
   IG_USERNAME=
   IG_PASSWORD=
   CHANNEL_ID=
   OPENAI_API_KEY=
   
   # google keys
   GOOGLE_KEY_TYPE=
   GOOGLE_KEY_PROJECT_ID=
   GOOGLE_KEY_PRIVATE_KEY_ID=
   GOOGLE_KEY_PRIVATE_KEY=
   GOOGLE_KEY_CLIENT_EMAIL=
   GOOGLE_KEY_CLIENT_ID=
   GOOGLE_KEY_AUTH_URI=
   GOOGLE_KEY_TOKEN_URI=
   GOOGLE_KEY_AUTH_PROVIDER_X509_CERT_URL=
   GOOGLE_KEY_CLIENT_X509_CERT_URL=
   GOOGLE_KEY_UNIVERSE_DOMAIN=
