#!/bin/bash
# Upload files only (no build on server). After this, SSH to server and run: cd /var/www/like-that && bash scripts/build-and-restart.sh

set -e
VPS_HOST="${VPS_HOST:-130.49.149.162}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/var/www/like-that}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

export RSYNC_RSH="ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 -o ServerAliveInterval=10"

echo "📤 Upload to $VPS_USER@$VPS_HOST:$VPS_PATH"
ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_PATH" 2>/dev/null || true

if [[ -f "$SCRIPT_DIR/.env" ]]; then
  echo "📄 Copying .env..."
  scp -o StrictHostKeyChecking=accept-new "$SCRIPT_DIR/.env" "$VPS_USER@$VPS_HOST:$VPS_PATH/.env"
fi

echo "📦 Rsync..."
rsync -avz --delete \
  --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.env' --exclude '.env.local' --exclude '.env.production' \
  --exclude '*.log' --exclude '.DS_Store' \
  ./ "$VPS_USER@$VPS_HOST:$VPS_PATH/"

echo ""
echo "✅ Upload done. Now run on the server:"
echo "   ssh $VPS_USER@$VPS_HOST \"cd $VPS_PATH && bash scripts/build-and-restart.sh\""
echo ""
