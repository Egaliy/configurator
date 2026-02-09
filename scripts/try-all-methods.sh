#!/bin/bash
# Попытка всех возможных способов доступа к VPS
# Запуск: ./scripts/try-all-methods.sh

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f deploy.sh ]]; then
  echo "Не найден deploy.sh с учётными данными."
  exit 1
fi

source <(grep -E '^VPS_IP=|^VPS_USER=|^VPS_PASSWORD=' deploy.sh | sed 's/\r$//')
VPS_IP="${VPS_IP//[[:space:]]/}"
VPS_USER="${VPS_USER//[[:space:]]/}"
VPS_PASSWORD="${VPS_PASSWORD//[[:space:]]/}"

if [[ -z "$VPS_IP" || -z "$VPS_PASSWORD" ]]; then
  echo "Ошибка: в deploy.sh не заданы VPS_IP или VPS_PASSWORD."
  exit 1
fi

FIX_CMD="systemctl start sshd && systemctl enable sshd && systemctl start nginx && cd /var/www/like-that 2>/dev/null && (pm2 restart like-that 2>/dev/null || pm2 start npm --name like-that -- start) && pm2 save && echo 'Done'"

echo "=== Попытка всех способов доступа к VPS ==="
echo ""

# Метод 1: SSH с разными таймаутами
echo "1. SSH (стандартный таймаут)..."
if command -v sshpass &>/dev/null; then
  for i in 1 2 3; do
    if sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 \
      "$VPS_USER@$VPS_IP" "$FIX_CMD" 2>&1; then
      echo "✅ SSH работает!"
      exit 0
    fi
    [ $i -lt 3 ] && sleep 5
  done
else
  echo "   sshpass не установлен, пропускаем"
fi

echo ""
echo "2. SSH (длинный таймаут)..."
if command -v sshpass &>/dev/null; then
  if timeout 60 sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    -o ServerAliveInterval=20 -o ServerAliveCountMax=60 \
    "$VPS_USER@$VPS_IP" "$FIX_CMD" 2>&1; then
    echo "✅ SSH работает с длинным таймаутом!"
    exit 0
  fi
fi

echo ""
echo "3. Проверка порта 22..."
if command -v nc &>/dev/null; then
  if nc -zv -w 5 "$VPS_IP" 22 2>&1 | grep -q "succeeded"; then
    echo "   Порт 22 открыт, но SSH не отвечает"
  else
    echo "   Порт 22 закрыт или недоступен"
  fi
fi

echo ""
echo "4. Проверка HTTP (nginx)..."
if curl -s --connect-timeout 5 "http://$VPS_IP/" >/dev/null 2>&1; then
  echo "   ✅ HTTP работает (nginx отвечает)"
else
  echo "   ❌ HTTP не отвечает"
fi

echo ""
echo "5. Проверка порта 8000 (FastAPI)..."
if curl -s --connect-timeout 5 "http://$VPS_IP:8000/health" >/dev/null 2>&1; then
  echo "   ✅ Порт 8000 работает (FastAPI)"
else
  echo "   ❌ Порт 8000 не отвечает"
fi

echo ""
echo "=== Рекомендации ==="
echo "1. Запустите GitHub Actions workflow: Actions → Fix via File Upload → Run workflow"
echo "2. Попробуйте открыть консоль VPS через панель провайдера"
echo "3. Свяжитесь с поддержкой провайдера VPS"
echo ""
echo "Подробнее: docs/ALTERNATIVE_METHODS.md"
