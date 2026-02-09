# Инструкция: Как запустить восстановление сайта

## Проблема
SSH с вашего Mac не подключается к серверу (таймауты), но сайт нужно восстановить.

## Решение: Запустите GitHub Actions workflow

### Шаг 1: Откройте GitHub
1. Перейдите на https://github.com/Egaliy/configurator
2. Нажмите на вкладку **"Actions"** (вверху)

### Шаг 2: Найдите и запустите workflow
1. В левом меню найдите **"Quick Fix - Install and Build"**
2. Нажмите на него
3. Справа нажмите кнопку **"Run workflow"**
4. Выберите ветку **"main"**
5. Нажмите зеленую кнопку **"Run workflow"**

### Шаг 3: Дождитесь завершения
- Workflow выполнит установку зависимостей (5-10 минут)
- Затем сборку приложения (2-5 минут)
- И запуск через PM2

### Шаг 4: Проверьте результат
После завершения workflow проверьте сайт:
```bash
curl http://app.ubernatural.io/api/admin/health
```

Должен вернуться JSON, а не 502 или HTML.

---

## Альтернатива: Если workflow не работает

Если GitHub Actions тоже не может подключиться по SSH, выполните команды **в консоли VPS** (через панель управления провайдера):

```bash
cd /var/www/like-that
npm ci
npx prisma generate
npm run build
pm2 restart like-that
pm2 save
```

---

## Статус
- ✅ Workflow создан: "Quick Fix - Install and Build"
- ⏳ Ожидает запуска вручную
- ❌ SSH с Mac не работает (таймауты)
