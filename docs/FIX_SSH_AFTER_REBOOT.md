# Исправление SSH после перезагрузки VPS

## Проблема

После перезагрузки VPS SSH-демон (`sshd`) не запускается автоматически, поэтому подключение по SSH не работает. Telegram-боты продолжают работать, т.к. они уже запущены в pm2.

## Решение

### Вариант 1: Через панель управления VPS (веб-консоль)

1. Зайдите в панель управления вашего VPS провайдера
2. Найдите опцию **"Консоль"**, **"VNC"**, **"Web Console"** или **"Terminal"**
3. Откройте консоль сервера
4. **Вбейте одну команду** (скопируйте целиком):

```bash
systemctl start sshd && systemctl enable sshd && systemctl start nginx && cd /var/www/like-that 2>/dev/null && (pm2 restart like-that 2>/dev/null || pm2 start npm --name like-that -- start) && pm2 save && echo "Done"
```

Эта команда запустит SSH, nginx и Like That одной строкой.

### Вариант 2: Скопировать готовый скрипт

В репозитории есть `scripts/fix-ssh-from-console.sh` — скопируйте его содержимое и выполните в консоли VPS.

### Вариант 3: После восстановления SSH

Когда SSH заработает, выполните с вашего Mac:

```bash
cd "/Users/egorgalij/Desktop/projects macbook/configurator"
./scripts/fix-domain-with-password.sh
```

Или через GitHub Actions: **Actions** → **Fix domain on VPS** → **Run workflow**.

## Проверка

После запуска SSH демона проверьте:

```bash
ssh root@130.49.149.162 "pm2 list; systemctl status nginx"
```

Если подключение работает — всё исправлено.
