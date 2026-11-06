#!/usr/bin/env bash
# Deploy Timocom Freight Monitor → /opt/timocom-freight-monitor + timo.logistikberater.at
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${VPS_HOST:?VPS_HOST fehlt}"
USER="${VPS_USER:?VPS_USER fehlt}"
PORT="${VPS_PORT:-22}"
REMOTE_DIR="/opt/timocom-freight-monitor"

export SSHPASS="${VPS_PASSWORD:?VPS_PASSWORD fehlt}"
SSH=(sshpass -e ssh -o StrictHostKeyChecking=accept-new -p "$PORT" "$USER@$HOST")
SCP=(sshpass -e scp -o StrictHostKeyChecking=accept-new -P "$PORT")

echo "==> Paket bauen"
rm -rf /tmp/timo-deploy
mkdir -p /tmp/timo-deploy/timocom-freight-monitor
tar -C "$ROOT/timocom-freight-monitor" \
  --exclude .venv \
  --exclude .deps \
  --exclude .git \
  --exclude __pycache__ \
  --exclude .env \
  -cf - . | tar -C /tmp/timo-deploy/timocom-freight-monitor -xf -
cp "$ROOT/deploy/nginx/timo.logistikberater.at.conf" /tmp/timo-deploy/
cp "$ROOT/deploy/systemd/timocom-freight-monitor.service" /tmp/timo-deploy/

echo "==> Sync nach $REMOTE_DIR"
"${SSH[@]}" "mkdir -p '$REMOTE_DIR/data'"
"${SCP[@]}" -r /tmp/timo-deploy/timocom-freight-monitor/. "$USER@$HOST:$REMOTE_DIR/"
"${SCP[@]}" /tmp/timo-deploy/timo.logistikberater.at.conf "$USER@$HOST:$REMOTE_DIR/"
"${SCP[@]}" /tmp/timo-deploy/timocom-freight-monitor.service "$USER@$HOST:$REMOTE_DIR/"

# Secrets aus Agent-Env auf VPS schreiben, falls vorhanden (nie in Git)
if [[ -n "${TIMOCOM_USERNAME:-}" && -n "${TIMOCOM_PASSWORD:-}" ]]; then
  echo "==> .env aus Secrets schreiben"
  "${SSH[@]}" "cat > '$REMOTE_DIR/.env'" <<EOF
TIMOCOM_USERNAME=${TIMOCOM_USERNAME}
TIMOCOM_PASSWORD=${TIMOCOM_PASSWORD}
TIMOCOM_BASE_URL=${TIMOCOM_BASE_URL:-https://api.timocom.com/freight-exchange/3}
SEARCH_INTERVAL_MINUTES=${SEARCH_INTERVAL_MINUTES:-30}
MAX_RESULTS=${MAX_RESULTS:-30}
DATA_DIR=data
TIMEZONE=Europe/Berlin
SUMMARY_HOUR=${SUMMARY_HOUR:-18}
SUMMARY_MINUTE=${SUMMARY_MINUTE:-0}
SMTP_HOST=${SMTP_HOST:-}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_USER=${SMTP_USER:-}
SMTP_PASSWORD=${SMTP_PASSWORD:-}
SMTP_USE_TLS=${SMTP_USE_TLS:-true}
MAIL_FROM=${MAIL_FROM:-}
MAIL_TO=${MAIL_TO:-}
EOF
  "${SSH[@]}" "chmod 600 '$REMOTE_DIR/.env'"
else
  echo "==> Keine TIMOCOM_* Secrets im Agent – bestehende .env auf VPS behalten (falls vorhanden)"
fi

echo "==> venv + Dependencies + Nginx + Service"
"${SSH[@]}" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/timocom-freight-monitor
python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt

# Placeholder-Hub, falls noch keine Daten
if [[ ! -f data/index.html ]]; then
  cat > data/index.html <<'HTML'
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Timocom Frachten – wird gestartet</title>
  <style>
    body { font-family: "Segoe UI", system-ui, sans-serif; background:#f4f6f8; color:#1a2332; margin:0; }
    header { background:#0069b4; color:#fff; padding:28px 32px; }
    main { padding:32px; max-width:720px; }
    code { background:#e8eef3; padding:2px 6px; border-radius:4px; }
  </style>
</head>
<body>
  <header><h1>Timocom Freight Monitor</h1>
  <p>timo.logistikberater.at</p></header>
  <main>
    <p>Monitor ist installiert. Sobald der erste Suchlauf läuft, erscheinen hier die Frachten-Tabellen.</p>
    <p>Service: <code>timocom-freight-monitor</code></p>
  </main>
</body>
</html>
HTML
fi

install -m 644 /opt/timocom-freight-monitor/timo.logistikberater.at.conf \
  /etc/nginx/sites-available/timo.logistikberater.at
ln -sfn /etc/nginx/sites-available/timo.logistikberater.at \
  /etc/nginx/sites-enabled/timo.logistikberater.at

if [[ ! -d /etc/letsencrypt/live/timo.logistikberater.at ]]; then
  cat >/etc/nginx/sites-available/timo.logistikberater.at <<'HTTPONLY'
server {
    listen 80;
    listen [::]:80;
    server_name timo.logistikberater.at;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / {
        root /opt/timocom-freight-monitor/data;
        index index.html;
    }
}
HTTPONLY
  nginx -t && systemctl reload nginx
  certbot certonly --webroot -w /var/www/html \
    -d timo.logistikberater.at \
    --non-interactive --agree-tos \
    -m mb@logistikberater.at \
    --keep-until-expiring || true
  install -m 644 /opt/timocom-freight-monitor/timo.logistikberater.at.conf \
    /etc/nginx/sites-available/timo.logistikberater.at
fi

nginx -t && systemctl reload nginx

install -m 644 /opt/timocom-freight-monitor/timocom-freight-monitor.service \
  /etc/systemd/system/timocom-freight-monitor.service
systemctl daemon-reload

if [[ -f /opt/timocom-freight-monitor/.env ]] && grep -q '^TIMOCOM_USERNAME=.\+' /opt/timocom-freight-monitor/.env; then
  systemctl enable --now timocom-freight-monitor.service
  # erster Sync im Hintergrund (Service läuft bereits dauerhaft)
  systemctl restart timocom-freight-monitor.service
  systemctl --no-pager --full status timocom-freight-monitor.service | head -20
else
  systemctl disable --now timocom-freight-monitor.service 2>/dev/null || true
  echo "WARN: .env ohne TIMOCOM_USERNAME – Service noch nicht gestartet"
fi

echo "OK https://timo.logistikberater.at/"
REMOTE

echo "==> Deploy fertig"
