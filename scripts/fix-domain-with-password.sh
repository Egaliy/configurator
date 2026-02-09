#!/bin/bash
# Починка на VPS: nginx + сборка/запуск Like That. Пароль берётся из deploy.sh.
# Запуск с Mac из корня репозитория: ./scripts/fix-domain-with-password.sh
# Нужен sshpass: brew install hudochenkov/sshpass/sshpass

set -e
echo "Starting fix-domain-with-password.sh..."
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
echo "Using repo root: $REPO_ROOT"

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

echo "Reloading nginx..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
  "$VPS_USER@$VPS_IP" "systemctl start ssh 2>/dev/null || systemctl start sshd 2>/dev/null || true; systemctl enable ssh 2>/dev/null || systemctl enable sshd 2>/dev/null || true; systemctl reload nginx"

echo "Building and starting Like That on server (5–10 min)..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
  -o ServerAliveInterval=15 -o ServerAliveCountMax=60 \
  "$VPS_USER@$VPS_IP" "cd /var/www/like-that && bash scripts/build-and-restart.sh"

echo ""
echo "Done. Check https://app.ubernatural.io and https://app.ubernatural.io/admin"
