# Инструкция по деплою на VPS

## Шаги для загрузки на VPS:

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
