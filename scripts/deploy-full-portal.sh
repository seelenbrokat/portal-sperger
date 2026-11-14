#!/usr/bin/env bash
# Deploy vollständiges Sperger-Portal (1:1 WOG-Kopie, rebranded) nach /opt/sperger-portal
# Getrennt von /opt/wog-portal (andere Ports: 3100/3101/5433/6380).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${VPS_HOST:?VPS_HOST fehlt}"
USER="${VPS_USER:?VPS_USER fehlt}"
PORT="${VPS_PORT:-22}"
REMOTE_DIR="/opt/sperger-portal"

export SSHPASS="${VPS_PASSWORD:?VPS_PASSWORD fehlt}"
SSH=(sshpass -e ssh -o StrictHostKeyChecking=accept-new -p "$PORT" "$USER@$HOST")

echo "==> Paket bauen (ohne node_modules/.next/dist/data)"
rm -rf /tmp/sperger-full-deploy
mkdir -p /tmp/sperger-full-deploy
tar -C "$ROOT/portal" \
  --exclude node_modules \
  --exclude '**/node_modules' \
  --exclude .next \
  --exclude '**/.next' \
  --exclude dist \
  --exclude '**/dist' \
  --exclude data \
  --exclude .env \
  --exclude .git \
  -cf - . | tar -C /tmp/sperger-full-deploy -xf -

# Runtime-.env (keine Secrets im Git)
cat > /tmp/sperger-full-deploy/.env <<EOF
DATABASE_URL=postgresql://sperger:sperger_secret@postgres:5432/sperger_portal?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=${SPERGER_JWT_SECRET:-sperger-portal-change-me-$(date +%s)}
JWT_EXPIRES_IN=7d
APP_URL=https://sperger.logistikberater.at
API_URL=https://sperger.logistikberater.at/api
API_PORT=3101
NODE_ENV=production
UPLOAD_DIR=/app/data/uploads
SFTP_INBOUND_DIR=/app/data/sftp/inbound
SFTP_OUTBOUND_DIR=/app/data/sftp/outbound
CORS_ORIGINS=https://sperger.logistikberater.at
SEED_ADMIN_EMAIL=${SEED_ADMIN_EMAIL:-admin@spedition-sperger.at}
SEED_ADMIN_PASSWORD=${SEED_ADMIN_PASSWORD:-SpergerAdmin6890!}
SEED_RESET_ADMIN_PASSWORD=${SEED_RESET_ADMIN_PASSWORD:-true}
SEED_DEMO_USERS=true
LOADING_LIST_NOTIFY_EMAIL=zoll@spedition-sperger.at
SSCC_GS1_COMPANY_PREFIX=9120101
SSCC_EXTENSION_DIGIT=0
EOF

cp "$ROOT/portal/nginx/sperger.conf" /tmp/sperger-full-deploy/sperger.logistikberater.at.conf

echo "==> Sync nach $REMOTE_DIR"
"${SSH[@]}" "mkdir -p '$REMOTE_DIR' '$REMOTE_DIR/data/uploads' '$REMOTE_DIR/data/sftp' '$REMOTE_DIR/data/integrations'"
# Bestehende .env (JWT etc.) nicht überschreiben
"${SSH[@]}" "test -f '$REMOTE_DIR/.env' && cp '$REMOTE_DIR/.env' /tmp/sperger-portal.env.bak || true"
# stop old thin next container if present
"${SSH[@]}" "docker rm -f sperger-portal-web 2>/dev/null || true"
# upload via tar pipe
tar -C /tmp/sperger-full-deploy -cf - . | "${SSH[@]}" "tar -C '$REMOTE_DIR' -xf -"
"${SSH[@]}" "test -f /tmp/sperger-portal.env.bak && mv /tmp/sperger-portal.env.bak '$REMOTE_DIR/.env' || true"

echo "==> Docker build & up (postgres/redis/api/worker/web)"
"${SSH[@]}" "cd '$REMOTE_DIR' && docker compose build && docker compose up -d"

echo "==> DB migrate + seed"
"${SSH[@]}" "cd '$REMOTE_DIR' && docker compose exec -T api npx prisma migrate deploy && docker compose exec -T api npx prisma db seed || docker compose exec -T api node -e \"require('child_process').execSync('npx prisma db seed',{stdio:'inherit'})\" || true"

echo "==> Nginx vHost"
"${SSH[@]}" bash -s <<'REMOTE'
set -euo pipefail
install -m 644 /opt/sperger-portal/sperger.logistikberater.at.conf \
  /etc/nginx/sites-available/sperger.logistikberater.at
ln -sfn /etc/nginx/sites-available/sperger.logistikberater.at \
  /etc/nginx/sites-enabled/sperger.logistikberater.at
nginx -t
systemctl reload nginx
docker compose -f /opt/sperger-portal/docker-compose.yml ps
REMOTE

echo "==> Deploy fertig: https://sperger.logistikberater.at/"
echo "    Login: admin@spedition-sperger.at (Passwort aus SEED_ADMIN_PASSWORD)"
