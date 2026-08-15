#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/admin/tokengauge
NODE_BIN_DIR=/opt/node-v24.19.0/bin

cd "$APP_DIR"
PATH="$NODE_BIN_DIR:$PATH" npm run check
install -d -m 755 "$APP_DIR/.next/standalone/.next/static"
cp -a "$APP_DIR/.next/static/." "$APP_DIR/.next/standalone/.next/static/"
if test -d "$APP_DIR/public"; then
  install -d -m 755 "$APP_DIR/.next/standalone/public"
  cp -a "$APP_DIR/public/." "$APP_DIR/.next/standalone/public/"
fi
sudo systemctl restart tokengauge.service
