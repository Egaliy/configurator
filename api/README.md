# Telegram lead API

Leads are sent only to users who have **authorized in the bot** by sending the password.

## Flow

1. **You** (or whoever should see leads): open the bot in Telegram, send the password (`TELEGRAM_BOT_PASSWORD`, e.g. `thank_you_egor`). The bot replies "You are authorized. You will receive new leads here."
2. **Website**: on form submit, `api/server.js` sends the lead to all authorized chat_ids (from `api/authorized_chats.json`). If no one is authorized, the lead is accepted but not sent to Telegram.

## Run on VPS (or locally)

**1. Environment**

In `.env` (or env vars):

- `TELEGRAM_BOT_TOKEN` — bot token from @BotFather
- `TELEGRAM_BOT_PASSWORD` — password users send to the bot to get leads (e.g. `thank_you_egor`)

**2. Run both processes**

- **API** (receives form submissions, sends to authorized chats):
  ```bash
  node api/server.js
  ```
- **Bot** (listens for messages; when someone sends the password, adds their chat_id to `authorized_chats.json`):
  ```bash
  node api/bot.js
  ```

Use PM2 (or similar) so both keep running:

```bash
pm2 start api/server.js --name lead-api
pm2 start api/bot.js --name lead-bot
pm2 save
```

**3. Nginx**

Proxy `/api/` to the API server (e.g. port 3001):

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

**4. Frontend**

In `.env`: `VITE_SEND_LEAD_API_URL=/api/send-lead` (относительный URL — подходит и для VPS, и для Vercel). Rebuild and deploy the site.

## Deploy on Vercel

1. Подключи репозиторий к Vercel, деплой подхватит `vercel.json` и соберёт фронт из `dist/`.
2. В настройках проекта Vercel → Settings → Environment Variables добавь:
   - `TELEGRAM_BOT_TOKEN` — токен бота
   - `TELEGRAM_AUTHORIZED_CHAT_IDS` — через запятую chat_id получателей заявок (например `328826190`). Новых пользователей добавляй сюда вручную или получи chat_id через бота на VPS.
3. Бот для авторизации по паролю (`api/bot.js`) на Vercel не запускается — оставь его на VPS. Когда кто-то новый вводит пароль в боте, добавь его chat_id в `TELEGRAM_AUTHORIZED_CHAT_IDS` в Vercel.

## Files

- `api/server.js` — HTTP API для VPS, отправляет заявки в Telegram
- `api/send-lead.js` — serverless-версия для Vercel (тот же функционал, chat_id из env)
- `api/bot.js` — Telegram long polling; по паролю добавляет chat_id в `authorized_chats.json`
- `api/authorized_chats.json` — список chat_id (создаётся ботом на VPS, в репо не коммитить)
