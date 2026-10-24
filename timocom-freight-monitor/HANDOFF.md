# Handoff: Timocom Freight Monitor

Für neuen Cursor-Cloud-Agent / neuen Chat – Kontext komplett.

## Repo & Branch

- Repo: `https://github.com/seelenbrokat/portal-sperger`
- Branch: `cursor/timo-freight-monitor-6c13`
- PR: https://github.com/seelenbrokat/portal-sperger/pull/3
- App-Ordner: `timocom-freight-monitor/`

## Live

- URL: https://timo.logistikberater.at/
- HTTP-Basic-Auth: Benutzer `sperger`, Passwort nur auf dem VPS in `/etc/nginx/.htpasswd-timo` (nicht im Git)
- VPS-Pfad: `/opt/timocom-freight-monitor`
- systemd: `timocom-freight-monitor.service` (Suche alle 30 Min)
- Nginx: `/etc/nginx/sites-available/timo.logistikberater.at`
- Deploy-Skript: `./scripts/deploy-timo-vps.sh`
- Getrennt von Sperger (`/opt/sperger-portal`, Port 3100) und WOG

## Routen

| ID | Richtung |
|----|----------|
| `ulm_vorarlberg` | Ulm 30 km → Vorarlberg (67/68/69) |
| `ulm_schweiz` | Ulm 30 km → ganze CH |
| `vorarlberg_schweiz` | Vorarlberg → ganze CH |
| `schweiz_vorarlberg` | CH → Vorarlberg |
| `schweiz_oesterreich` | CH → ganz AT, max. 6 Lademeter |

## Verhalten

- Excel + HTML unter `data/`; Angebote werden nur upsertet, **nicht gelöscht** wenn sie von Timocom verschwinden
- Analytics: https://timo.logistikberater.at/analytics.html inkl. Excel-Download
- Tagesmail 18:00 Europe/Berlin vorgesehen – **SMTP noch nicht konfiguriert** (`SMTP_*`, `MAIL_TO` in `.env`)

## Secrets (nur VPS `.env`, nicht committen)

- `TIMOCOM_USERNAME` / `TIMOCOM_PASSWORD` / `TIMOCOM_BASE_URL` sind gesetzt
- Optional ergänzen: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `MAIL_TO`

## Nützliche Befehle (auf VPS)

```bash
systemctl status timocom-freight-monitor
journalctl -u timocom-freight-monitor -f
cd /opt/timocom-freight-monitor && .venv/bin/python main.py --once
cd /opt/timocom-freight-monitor && .venv/bin/python main.py --refresh-web
cd /opt/timocom-freight-monitor && .venv/bin/python main.py --summary-now
```

## Startprompt für neuen Chat

```text
Arbeite am Timocom Freight Monitor.
Repo: seelenbrokat/portal-sperger
Branch: cursor/timo-freight-monitor-6c13
Live: https://timo.logistikberater.at/ (Basic-Auth)
VPS: /opt/timocom-freight-monitor, Service timocom-freight-monitor
Lies timocom-freight-monitor/HANDOFF.md und mach weiter nur an diesem Projekt (getrennt von Sperger/WOG).
```
