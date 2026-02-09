#!/bin/bash
# SSH с повторными попытками и задержками
# Использование: ./scripts/ssh-retry.sh "команда"

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

source <(grep -E '^VPS_IP=|^VPS_USER=|^VPS_PASSWORD=' deploy.sh | sed 's/\r$//')
VPS_IP="${VPS_IP//[[:space:]]/}"
VPS_USER="${VPS_USER//[[:space:]]/}"
VPS_PASSWORD="${VPS_PASSWORD//[[:space:]]/}"

COMMAND="${1:-'echo "Connected successfully"'}"
MAX_ATTEMPTS=5
DELAY=10

for i in $(seq 1 $MAX_ATTEMPTS); do
  echo "Attempt $i/$MAX_ATTEMPTS..."
  
  if sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=20 -o ServerAliveInterval=5 \
    "$VPS_USER@$VPS_IP" bash -c "$COMMAND" 2>&1; then
    echo "Success!"
    exit 0
  fi
  
  if [ $i -lt $MAX_ATTEMPTS ]; then
    echo "Failed. Waiting ${DELAY}s before retry..."
    sleep $DELAY
  fi
done

echo "All attempts failed."
exit 1
