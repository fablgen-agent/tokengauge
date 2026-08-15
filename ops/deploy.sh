#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/admin/tokengauge
NODE_BIN_DIR=/opt/node-v24.19.0/bin

cd "$APP_DIR"
set -a
# Static metadata and sitemap URLs are resolved at build time, so the production
# origin must be present before `next build`, not only in the systemd service.
source /home/admin/.config/tokengauge/runtime.env
set +a
if [[ "${APP_URL:-}" != https://* ]]; then
  echo "APP_URL must be an HTTPS production origin before deployment." >&2
  exit 1
fi
PATH="$NODE_BIN_DIR:$PATH" npm run check
if grep -R -q 'http://127\.0\.0\.1:3000' "$APP_DIR/.next/server/app/pricing"*.html; then
  echo "Loopback canonical found in the production pricing build." >&2
  exit 1
fi
if ! grep -F -q "$APP_URL/pricing" "$APP_DIR/.next/server/app/pricing.html"; then
  echo "Production pricing canonical was not emitted during the build." >&2
  exit 1
fi
install -d -m 755 "$APP_DIR/.next/standalone/.next/static"
cp -a "$APP_DIR/.next/static/." "$APP_DIR/.next/standalone/.next/static/"
if test -d "$APP_DIR/public"; then
  install -d -m 755 "$APP_DIR/.next/standalone/public"
  cp -a "$APP_DIR/public/." "$APP_DIR/.next/standalone/public/"
fi
sudo systemctl restart tokengauge.service
