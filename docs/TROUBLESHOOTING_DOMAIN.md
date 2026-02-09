# Почему не работает сайт на домене (app.ubernatural.io)

## Быстрая починка через GitHub Actions (без SSH с вашего компьютера)

1. **Секреты (обязательно).** Нужны именно **Repository secrets**, не Environment. В репозитории: **Settings** → **Secrets and variables** → **Actions** → в блоке **«Repository secrets»** (не внутри Environment) добавьте:
   - **VPS_HOST** — IP сервера, например `130.49.149.162`
   - **VPS_USER** — например `root`
   - **VPS_PASSWORD** — пароль от VPS  
   Если секреты сейчас только в Environment — создайте такие же три в разделе Repository secrets (имя репозитория → Settings → Secrets and variables → Actions → New repository secret).
2. На GitHub: **Actions** → workflow **«Fix domain on VPS»** → **Run workflow** → **Run workflow**.
3. Дождитесь окончания (до ~10–15 минут). Workflow загрузит код Like That на сервер, перезагрузит nginx и соберёт/запустит приложение.
4. Откройте https://app.ubernatural.io и https://app.ubernatural.io/admin.

Если в логах **«Connection reset by peer»** или **«kex_exchange_identification»** — соединение сбрасывается со стороны сервера. Workflow теперь делает до 3 попыток. На VPS проверьте: не блокирует ли **fail2ban** IP GitHub Actions; в `/etc/ssh/sshd_config` не ограничен ли доступ по IP (AllowUsers и т.п.).

---

## Быстрая починка (одной сессией SSH)

Если SSH доступен с вашего Mac, выполните **в своём терминале**:

```bash
ssh root@130.49.149.162 "systemctl reload nginx; cd /var/www/like-that && bash scripts/build-and-restart.sh"
```

Или из корня репозитория: `./scripts/fix-domain-on-server.sh`

После успешного выполнения откройте https://app.ubernatural.io и https://app.ubernatural.io/admin (при необходимости Ctrl+Shift+R).

---

## Как устроено

- **app.ubernatural.io** может показывать:
  1. **Основной конфигуратор** (Vite SPA): `/`, `/projects`, `/like-that` — статика из `/var/www/configurator`
  2. **Like That** (Next.js): приложение на Node (pm2), обычно за прокси по пути `/like-that-app/` или на отдельном порту

- В репозитории лежит **nginx-config** только для IP `130.49.149.162` и статики конфигуратора. Конфиг для домена **app.ubernatural.io** настраивается на сервере отдельно.

---

## Что проверить по шагам

### 1. DNS

Убедиться, что домен указывает на ваш сервер:

```bash
dig app.ubernatural.io +short
# или
nslookup app.ubernatural.io
```

Должен быть IP вашего VPS (например `130.49.149.162`). Если другой IP или пусто — поправить A-запись у регистратора.

---

### 2. Nginx на сервере

Зайти по SSH и посмотреть, есть ли конфиг для домена:

```bash
ssh root@130.49.149.162
grep -r "app.ubernatural.io" /etc/nginx/
cat /etc/nginx/sites-enabled/*
```

- Если **нет** `server_name app.ubernatural.io` — nginx не обрабатывает этот домен, запросы уходят в default — сайт «не работает». Нужно добавить конфиг (пример ниже).
- Если конфиг есть — проверить пути (`root`, `proxy_pass`) и перезагрузить nginx: `nginx -t && systemctl reload nginx`.

---

### 3. Like That (Node / pm2)

Если на домене отдаётся Like That или путь `/like-that-app/` проксируется в Node:

```bash
ssh root@130.49.149.162
pm2 list
pm2 logs like-that --lines 30
```

- Нет процесса `like-that` или статус не `online` — перезапуск:  
  `cd /var/www/like-that && pm2 start npm --name like-that -- start` или `pm2 restart like-that`.
- В логах ошибки (порт, БД, модули) — исправить по тексту ошибки.

---

### 4. Права и наличие файлов

```bash
# Конфигуратор (статическая сборка)
ls -la /var/www/configurator/index.html

# Like That
ls -la /var/www/like-that/.next
ls -la /var/www/like-that/package.json
```

Нет файлов или доступ запрещён — доставить сборку/код (деплой) и выставить владельца, например `www-data` или пользователь, под которым крутится nginx/pm2.

---

### 5. Порт Next.js

Обычно Like That слушает порт 3000. Проверить:

```bash
ssh root@130.49.149.162
ss -tlnp | grep 3000
# или
netstat -tlnp | grep 3000
```

Если порт не слушается — приложение не запущено или упало (см. pm2).

---

## Пример конфига nginx для app.ubernatural.io

Вариант: один домен, конфигуратор как статика и прокси на Like That по `/like-that-app/`.

Создать на сервере файл, например `/etc/nginx/sites-available/app-ubernatural`:

```nginx
server {
    listen 80;
    server_name app.ubernatural.io;

    # Конфигуратор (Vite SPA) — корень и все пути кроме /like-that-app/
    root /var/www/configurator;
    index index.html;
    include /etc/nginx/mime.types;

    location /like-that-app/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /imgs/ {
        alias /var/www/configurator/imgs/;
    }
}
```

Включить и перезагрузить:

```bash
ln -sf /etc/nginx/sites-available/app-ubernatural /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Если Like That на домене отдаётся **целиком** (без конфигуратора), то вместо `root /var/www/configurator` и `location /` делают один `location /` с `proxy_pass http://127.0.0.1:3000;`. Тогда конфигуратор по этому домену открываться не будет.

---

## Краткий чеклист

| Проверка | Команда / действие |
|----------|--------------------|
| DNS | `dig app.ubernatural.io +short` → IP сервера |
| Nginx для домена | `grep -r "app.ubernatural.io" /etc/nginx/` |
| Перезагрузка nginx | `nginx -t && systemctl reload nginx` |
| Like That запущен | `pm2 list` → like-that online |
| Логи Like That | `pm2 logs like-that` |
| Порт 3000 | `ss -tlnp \| grep 3000` |
| Файлы конфигуратора | `ls /var/www/configurator/index.html` |
| Файлы Like That | `ls /var/www/like-that/.next` |

После изменений nginx или pm2 проверить в браузере:  
https://app.ubernatural.io и https://app.ubernatural.io/admin (при необходимости — жёсткое обновление Ctrl+Shift+R).
