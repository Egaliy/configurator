# Инструкция по деплою на VPS

## Автоматический деплой (GitHub Actions)

При пуше в ветку `main` проект собирается и выгружается на VPS через `.github/workflows/deploy.yml`.

### Настройка один раз

1. **Создай SSH-ключ для деплоя** (если ещё нет отдельного):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/configurator_deploy -N ""
   ```

2. **Добавь публичный ключ на VPS:**
   ```bash
   ssh-copy-id -i ~/.ssh/configurator_deploy.pub root@130.49.149.162
   ```
   Либо вручную: скопируй содержимое `~/.ssh/configurator_deploy.pub` и добавь в `~/.ssh/authorized_keys` на сервере.

3. **Секреты в GitHub:** репозиторий → Settings → Secrets and variables → Actions → New repository secret:
   - `VPS_HOST` = `130.49.149.162`
   - `VPS_USER` = `root`
   - `VPS_SSH_PRIVATE_KEY` = весь текст из файла `~/.ssh/configurator_deploy` (приватный ключ, включая строки `-----BEGIN ... KEY-----` и `-----END ... KEY-----`)

4. По желанию: секрет `VPS_REMOTE_DIR` (по умолчанию `/var/www/configurator`).

После этого каждый `git push origin main` запускает сборку и выгрузку на VPS.

---

## Ручная загрузка на VPS

### 1. Установите sshpass (если еще не установлен):
```bash
brew install hudochenkov/sshpass/sshpass
```

### 2. Соберите проект:
```bash
npm run build
```

### 3. Подключитесь к VPS и создайте директорию:
```bash
ssh root@130.49.149.162
mkdir -p /var/www/configurator
exit
```

### 4. Загрузите файлы на сервер:
```bash
cd "/Users/egorgalij/Desktop/projects macbook/configurator"
scp -r dist/* root@130.49.149.162:/var/www/configurator/
```

Или используйте скрипт:
```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. Настройте Nginx на VPS:

Подключитесь к серверу:
```bash
ssh root@130.49.149.162
```

Установите Nginx (если еще не установлен):
```bash
apt update
apt install nginx -y
```

Создайте конфигурацию:
```bash
nano /etc/nginx/sites-available/configurator
```

Добавьте следующую конфигурацию:
```nginx
server {
    listen 80;
    server_name 130.49.149.162;

    root /var/www/configurator;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /imgs/ {
        alias /var/www/configurator/imgs/;
    }
}
```

Активируйте конфигурацию:
```bash
ln -s /etc/nginx/sites-available/configurator /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 6. Скопируйте папку imgs на сервер:
```bash
scp -r imgs root@130.49.149.162:/var/www/configurator/
```

### 7. Проверьте доступность:
Откройте в браузере: `http://130.49.149.162`

## Альтернативный вариант с Node.js сервером:

Если хотите использовать простой Node.js сервер:

1. Создайте файл `server.js` на VPS:
```javascript
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'dist')));
app.use('/imgs', express.static(path.join(__dirname, 'imgs')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

2. Установите зависимости и запустите:
```bash
npm install express
node server.js
```

3. Используйте PM2 для постоянной работы:
```bash
npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup
```
