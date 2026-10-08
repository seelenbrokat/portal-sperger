#!/usr/bin/env bash
# Deploy Sperger Portal nach /opt/sperger-portal (getrennt von /opt/wog-portal).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${VPS_HOST:?VPS_HOST fehlt}"
USER="${VPS_USER:?VPS_USER fehlt}"
PORT="${VPS_PORT:-22}"
REMOTE_DIR="/opt/sperger-portal"

export SSHPASS="${VPS_PASSWORD:?VPS_PASSWORD fehlt}"
SSH=(sshpass -e ssh -o StrictHostKeyChecking=accept-new -p "$PORT" "$USER@$HOST")
SCP=(sshpass -e scp -o StrictHostKeyChecking=accept-new -P "$PORT")

echo "==> Paket bauen"
rm -rf /tmp/sperger-portal-deploy
mkdir -p /tmp/sperger-portal-deploy
rsync -a --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude '.git' \
  "$ROOT/web/" /tmp/sperger-portal-deploy/web/
cp "$ROOT/deploy/nginx/sperger.logistikberater.at.conf" /tmp/sperger-portal-deploy/

echo "==> Nach $REMOTE_DIR syncen"
"${SSH[@]}" "mkdir -p '$REMOTE_DIR'"
"${SCP[@]}" -r /tmp/sperger-portal-deploy/web "$USER@$HOST:$REMOTE_DIR/"
"${SCP[@]}" /tmp/sperger-portal-deploy/sperger.logistikberater.at.conf \
  "$USER@$HOST:$REMOTE_DIR/sperger.logistikberater.at.conf"

echo "==> Docker image bauen & starten (Port 3100)"
"${SSH[@]}" "cd '$REMOTE_DIR/web' && docker compose build && docker compose up -d"

echo "==> Nginx vHost + TLS"
"${SSH[@]}" bash -s <<'REMOTE'
set -euo pipefail
install -m 644 /opt/sperger-portal/sperger.logistikberater.at.conf \
  /etc/nginx/sites-available/sperger.logistikberater.at
ln -sfn /etc/nginx/sites-available/sperger.logistikberater.at \
  /etc/nginx/sites-enabled/sperger.logistikberater.at

# Zertifikat anfordern, falls noch nicht vorhanden
if [[ ! -d /etc/letsencrypt/live/sperger.logistikberater.at ]]; then
  # Temporärer HTTP-only vHost für ACME
  cat >/etc/nginx/sites-available/sperger.logistikberater.at <<'HTTPONLY'
server {
    listen 80;
    listen [::]:80;
    server_name sperger.logistikberater.at;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 200 'sperger portal acme ready\n'; add_header Content-Type text/plain; }
}
HTTPONLY
  nginx -t && systemctl reload nginx
  certbot certonly --webroot -w /var/www/html \
    -d sperger.logistikberater.at \
    --non-interactive --agree-tos \
    -m marcel.burtscher@worldofgreen.ch \
    --keep-until-expiring
  install -m 644 /opt/sperger-portal/sperger.logistikberater.at.conf \
    /etc/nginx/sites-available/sperger.logistikberater.at
fi

nginx -t
systemctl reload nginx
docker ps --filter name=sperger-portal-web --format '{{.Names}} {{.Status}} {{.Ports}}'
REMOTE

echo "==> Deploy fertig: https://sperger.logistikberater.at/"
