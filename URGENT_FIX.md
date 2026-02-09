# ⚠️ СРОЧНО: Восстановление сайта

## Проблема
SSH с Mac не подключается (таймауты на handshake), сайт не работает.

## Решение: Запустите GitHub Actions workflow СЕЙЧАС

### Вариант 1: Quick Fix workflow (рекомендуется)

1. **Откройте:** https://github.com/Egaliy/configurator/actions
2. **Найдите:** "Quick Fix - Install and Build" в левом меню
3. **Нажмите:** "Run workflow" → "Run workflow"
4. **Ждите:** 10-15 минут

### Вариант 2: Fix domain on VPS workflow

1. **Откройте:** https://github.com/Egaliy/configurator/actions
2. **Найдите:** "Fix domain on VPS" в левом меню  
3. **Нажмите:** "Run workflow" → "Run workflow"
4. **Ждите:** 10-15 минут

### Вариант 3: Через консоль VPS (если есть доступ)

Выполните в консоли VPS (через панель управления провайдера):

```bash
cd /var/www/like-that
npm ci
npx prisma generate
npm run build
pm2 restart like-that
pm2 save
```

## После выполнения

Проверьте сайт:
```bash
curl http://app.ubernatural.io/api/admin/health
```

Должен вернуться JSON, а не 502.

---

**ВАЖНО:** Я не могу подключиться по SSH с Mac (таймауты), поэтому нужен ваш запуск workflow вручную или доступ к консоли VPS.
