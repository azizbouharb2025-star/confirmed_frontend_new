#!/bin/bash
# Frontend deploy script
# Runs as: ubuntu user under PM2 webhook process
# Logs go to $HOME/logs/ which ubuntu always owns

set -e

LOG_DIR="$HOME/logs"
LOG_FILE="$LOG_DIR/deploy-frontend.log"
DEPLOY_DIR="/var/www/confirmed.tn/confirmed_frontend_new"

mkdir -p "$LOG_DIR"

exec >> "$LOG_FILE" 2>&1

echo ""
echo "========================================"
echo "Frontend deploy started: $(date)"
echo "========================================"

cd "$DEPLOY_DIR"

echo "→ Pulling latest code..."
git pull origin main

echo "→ Installing dependencies..."
npm ci --prefer-offline

echo "→ Building Next.js..."
npm run build

echo "→ Restarting PM2 process..."
pm2 restart confirmed-frontend --update-env || pm2 start npm --name confirmed-frontend -- start

echo "→ Saving PM2 process list..."
pm2 save

echo "✓ Frontend deploy completed: $(date)"
