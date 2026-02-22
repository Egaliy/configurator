#!/bin/bash

# VPS connection details
VPS_IP="130.49.149.162"
VPS_USER="root"
VPS_PASSWORD="PjuRKDx6pe3CCNPb"
REMOTE_DIR="/var/www/configurator"

echo "Building project..."
npm run build

echo "Uploading files to VPS..."
sshpass -p "$VPS_PASSWORD" scp -r dist/* "$VPS_USER@$VPS_IP:$REMOTE_DIR/"

echo "Deployment complete!"
