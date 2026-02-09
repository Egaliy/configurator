#!/bin/bash
# Полное восстановление сервера: SSH, зависимости, сборка, запуск
# Запуск: ./scripts/complete-fix.sh

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f deploy.sh ]]; then
  echo "Не найден deploy.sh с учётными данными."
  exit 1
fi

VPS_IP=$(grep -E '^VPS_IP=' deploy.sh | head -1 | cut -d'"' -f2)
VPS_USER=$(grep -E '^VPS_USER=' deploy.sh | head -1 | cut -d'"' -f2)
VPS_PASSWORD=$(grep -E '^VPS_PASSWORD=' deploy.sh | head -1 | cut -d'"' -f2)

if [[ -z "$VPS_IP" || -z "$VPS_PASSWORD" ]]; then
  echo "Ошибка: в deploy.sh не заданы VPS_IP или VPS_PASSWORD."
  exit 1
fi

if ! command -v sshpass &>/dev/null; then
  echo "Установите sshpass: brew install hudochenkov/sshpass/sshpass"
  exit 1
fi

echo "=== Полное восстановление сервера ==="
echo ""

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=20 -o ServerAliveCountMax=60"

echo "1. Запуск SSH демона..."
sshpass -p "$VPS_PASSWORD" ssh $SSH_OPTS "$VPS_USER@$VPS_IP" \
  "systemctl start ssh 2>/dev/null || systemctl start sshd 2>/dev/null || true; \
   systemctl enable ssh 2>/dev/null || systemctl enable sshd 2>/dev/null || true; \
   systemctl start nginx" 2>&1 | grep -v "Warning: Permanently added" || true

echo "✅ SSH и nginx запущены"
echo ""

echo "2. Установка зависимостей и сборка (это может занять 5-10 минут)..."
echo "   Запускаю в фоне, логи: /tmp/fix-app.log"

sshpass -p "$VPS_PASSWORD" ssh $SSH_OPTS "$VPS_USER@$VPS_IP" <<'ENDSSH'
cd /var/www/like-that
nohup bash -c '
  echo "=== Начало установки зависимостей ===" >> /tmp/fix-app.log
  npm ci >> /tmp/fix-app.log 2>&1
  echo "=== Prisma generate ===" >> /tmp/fix-app.log
  npx prisma generate >> /tmp/fix-app.log 2>&1
  echo "=== Сборка приложения ===" >> /tmp/fix-app.log
  npm run build >> /tmp/fix-app.log 2>&1
  echo "=== Перезапуск PM2 ===" >> /tmp/fix-app.log
  pm2 restart like-that 2>>/tmp/fix-app.log || pm2 start npm --name like-that -- start >> /tmp/fix-app.log 2>&1
  pm2 save >> /tmp/fix-app.log 2>&1
  echo "=== Готово ===" >> /tmp/fix-app.log
' > /dev/null 2>&1 &
echo $!
ENDSSH

echo "   Процесс запущен в фоне"
echo ""

echo "3. Ожидание завершения (проверяю каждые 10 секунд)..."
for i in {1..60}; do
  sleep 10
  STATUS=$(sshpass -p "$VPS_PASSWORD" ssh $SSH_OPTS "$VPS_USER@$VPS_IP" \
    "if pgrep -f 'npm ci|npm run build' > /dev/null; then echo 'running'; else echo 'done'; fi" 2>/dev/null || echo "error")
  
  if [[ "$STATUS" == "done" ]]; then
    echo "   ✅ Процесс завершён"
    break
  fi
  
  if (( i % 6 == 0 )); then
    echo "   ⏳ Ещё выполняется... (прошло $((i*10)) секунд)"
  fi
done

echo ""
echo "4. Проверка результата..."
sshpass -p "$VPS_PASSWORD" ssh $SSH_OPTS "$VPS_USER@$VPS_IP" <<'ENDSSH'
echo "=== Последние строки лога ==="
tail -20 /tmp/fix-app.log 2>/dev/null || echo "Лог не найден"
echo ""
echo "=== Статус PM2 ==="
pm2 list
echo ""
echo "=== Проверка приложения ==="
curl -s http://127.0.0.1:3000/api/admin/health 2>/dev/null | head -5 || echo "Приложение не отвечает на localhost:3000"
ENDSSH

echo ""
echo "=== Готово ==="
echo "Проверьте сайт: http://app.ubernatural.io"
echo "Логи на сервере: /tmp/fix-app.log"
