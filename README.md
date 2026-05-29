# diptype

**Написание дипломных работ в пару кликов.** diptype — это веб-сервис, который по
прикреплённым документам и текстовому промпту создаёт дипломную работу, презентацию,
сайт-визитку и защитную речь, а затем при желании загружает все файлы в GitHub-репозиторий
пользователя. Обработка идёт через Anthropic API; оплата подписки — через YooMoney.

## ✨ Возможности

- **Мини-лендинг** с современными WebGL-шейдерами и анимациями (сине-белая палитра, без неона).
- **Регистрация / вход** с JWT-авторизацией.
- **Кабинет**: прикрепление документов + промпт → генерация → просмотр, скачивание и push в GitHub.
- **Бесплатно**: первые 3 дипломные работы.
- **Подписка diptype Pro**: безлимит + презентации, сайты, речи и выгрузка в GitHub.
  - 4 990 ₽ / месяц
  - 29 990 ₽ / год
- **Способы оплаты**: банковская карта (YooMoney) или криптовалюта в сети **TON**.

## 🧱 Стек

| Слой      | Технологии                                                        |
|-----------|-------------------------------------------------------------------|
| Frontend  | React, Vite, TypeScript, Tailwind CSS, Framer Motion, WebGL       |
| Backend   | Node.js, Express, better-sqlite3, JWT, multer                     |
| ИИ        | Anthropic API (`@anthropic-ai/sdk`)                               |
| Оплата    | YooMoney / YooKassa · криптовалюта TON (toncenter)               |

## 🚀 Запуск

```bash
# 1. Установить зависимости (корень + server + client)
npm run install:all

# 2. Настроить окружение
cp server/.env.example server/.env
#   при наличии — впишите ANTHROPIC_API_KEY, YOOMONEY_SHOP_ID, YOOMONEY_SECRET_KEY

# 3. Запустить dev-режим (API :4000 + клиент :5173)
npm run dev
```

Откройте http://localhost:5173.

### Demo-режим

Без ключей сервис полностью кликабелен:
- **Anthropic**: без `ANTHROPIC_API_KEY` генерация возвращает осмысленную заглушку.
- **YooMoney**: без credentials оплата сразу активирует подписку Pro (для демонстрации).

## 🏗 Сборка для прода

```bash
npm run build      # собирает client/dist
npm start          # Express отдаёт API и собранный фронтенд
```

## 📁 Структура

```
diptype/
├── client/                 # React + Vite фронтенд
│   └── src/
│       ├── components/      # ShaderBackground, Navbar, Pricing, ...
│       ├── pages/           # Landing, Login, Register, Dashboard
│       ├── auth/            # AuthContext
│       └── api.ts           # HTTP-клиент
├── server/                 # Express API
│   └── src/
│       ├── routes/          # auth, generate, payments
│       ├── services/        # anthropic, github
│       ├── middleware/      # auth (JWT)
│       └── db.js            # SQLite
└── .claude/skills/diptype/  # универсальный скилл генерации
```

## 🔌 API (кратко)

| Метод | Путь                          | Описание                              |
|-------|-------------------------------|---------------------------------------|
| POST  | `/api/auth/register`          | Регистрация                           |
| POST  | `/api/auth/login`             | Вход                                  |
| GET   | `/api/auth/me`                | Текущий пользователь                  |
| POST  | `/api/generate`               | Генерация (multipart: kind, prompt, files) |
| GET   | `/api/generations`            | История генераций                     |
| POST  | `/api/generations/:id/push`   | Загрузка результата в GitHub          |
| GET   | `/api/payments/plans`         | Тарифы                                |
| POST  | `/api/payments/checkout`      | Оформление подписки (method: yoomoney/ton) |
| POST  | `/api/payments/ton/verify`    | Проверка поступления TON-платежа      |
| POST  | `/api/payments/webhook`       | Вебхук YooMoney                       |

## ⚙️ Переменные окружения

См. `server/.env.example`. Ключевые: `JWT_SECRET`, `ANTHROPIC_API_KEY`,
`YOOMONEY_SHOP_ID`, `YOOMONEY_SECRET_KEY`, `TON_WALLET_ADDRESS`, `TONCENTER_API_KEY`,
`TON_RUB_RATE`, `GITHUB_TOKEN`, `FREE_REQUEST_LIMIT`.

### Demo-режим оплаты

Без `YOOMONEY_*` оплата картой сразу активирует подписку (для демонстрации).
Без `TON_WALLET_ADDRESS` оплата криптовалютой показывает реквизиты TON, а проверка
платежа подтверждает подписку без реальной транзакции. С настроенным кошельком
поступление перевода проверяется через toncenter по комментарию и сумме.
