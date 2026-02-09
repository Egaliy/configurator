#!/bin/bash
# Run from your Mac (with SSH to server). Reloads nginx for app.ubernatural.io and builds/starts Like That.
# Usage: ./scripts/fix-domain-on-server.sh
# Or: bash scripts/fix-domain-on-server.sh

set -e
VPS_HOST="${VPS_HOST:-130.49.149.162}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/var/www/like-that}"

echo "Reloading nginx..."
ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 "$VPS_USER@$VPS_HOST" "systemctl reload nginx"

echo "Building and starting Like That on server (this may take 5–10 min)..."
ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=30 -o ServerAliveInterval=20 -o ServerAliveCountMax=30 "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && bash scripts/build-and-restart.sh"

echo ""
echo "Done. Check https://app.ubernatural.io and https://app.ubernatural.io/admin"
