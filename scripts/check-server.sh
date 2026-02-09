#!/bin/bash
# Проверка процессов и файлов на VPS
# Запуск: ./scripts/check-server.sh

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

if ! command -v sshpass &>/dev/null; then
  echo "Установите sshpass: brew install hudochenkov/sshpass/sshpass"
  exit 1
fi

echo "=== Подключение к $VPS_USER@$VPS_IP ==="
echo ""

sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=25 \
  "$VPS_USER@$VPS_IP" <<'ENDSSH'
echo "=== PM2 ПРОЦЕССЫ ==="
pm2 list 2>/dev/null || echo "pm2 не установлен или нет процессов"
echo ""

echo "=== SYSTEMD СЕРВИСЫ (nginx, node, etc) ==="
systemctl list-units --type=service --state=running --no-pager | grep -E 'nginx|node|pm2|telegram|bot' || echo "нет подходящих сервисов"
echo ""

echo "=== ПРОЦЕССЫ (top 40 по памяти) ==="
ps aux --sort=-%mem 2>/dev/null | head -40 || ps aux 2>/dev/null | head -40
echo ""

echo "=== ПОРТЫ (слушающие) ==="
ss -tlnp 2>/dev/null | grep -E ':(80|443|3000|22|8080|9000)' || netstat -tlnp 2>/dev/null | grep -E ':(80|443|3000|22|8080|9000)' || echo "не удалось проверить порты"
echo ""

echo "=== ФАЙЛЫ /var/www ==="
ls -lah /var/www/ 2>/dev/null || echo "/var/www не существует"
echo ""

echo "=== ФАЙЛЫ /var/www/like-that (если есть) ==="
ls -lah /var/www/like-that/ 2>/dev/null | head -30 || echo "/var/www/like-that не существует"
echo ""

echo "=== ФАЙЛЫ /var/www/configurator (если есть) ==="
ls -lah /var/www/configurator/ 2>/dev/null | head -30 || echo "/var/www/configurator не существует"
echo ""

echo "=== NGINX КОНФИГИ ==="
ls -lah /etc/nginx/sites-enabled/ 2>/dev/null || echo "нет sites-enabled"
echo ""

echo "=== PM2 ЛОГИ (последние 20 строк) ==="
pm2 logs --lines 20 --nostream 2>/dev/null || echo "pm2 логи недоступны"
ENDSSH

echo ""
echo "=== Готово ==="
