#!/bin/bash
# Run this ON THE SERVER after rsync (e.g. ssh root@SERVER "cd /var/www/like-that && bash scripts/build-and-restart.sh")
# Installs deps, builds, restarts pm2.

set -e
cd "$(dirname "$0")/.."

echo "📦 npm ci..."
npm ci

echo "🔧 prisma generate..."
npx prisma generate

echo "🗄️ prisma db..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss 2>/dev/null || true

echo "🏗️ npm run build..."
npm run build

echo "🔄 pm2 restart..."
pm2 restart like-that 2>/dev/null || pm2 start npm --name like-that -- start

echo "✅ Done. App: http://$(hostname -I | awk '{print $1}')"
