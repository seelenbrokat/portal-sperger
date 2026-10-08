# Sperger Portal

Eigenständiges Kundenportal für **Spedition Sperger GmbH** (Lustenau).

**Wichtig:** Dieses Projekt ist **vollständig getrennt** von WOG / World of Green – eigene Domain, eigener Code, eigene Farben (Blau/Grau), eigene Container und Ports.

| | Sperger | WOG |
|---|---|---|
| Domain | `sperger.logistikberater.at` | `wog.logistikberater.at` |
| VPS-Pfad | `/opt/sperger-portal` | `/opt/wog-portal` |
| Web-Port | `127.0.0.1:3100` | `127.0.0.1:3000` |
| Branding | Blau `#005192` + Slate | Grün |

DNS: `sperger.logistikberater.at` zeigt per A-Record auf den Logistikberater-VPS
(gleiche Maschine wie die anderen `*.logistikberater.at`-Dienste, getrennt von WOG).

## Struktur

- `web/` – Next.js Kundenportal (Landing, Login, Tracking, Dashboard)
- `android/` – optionale Scanner-App (historischer Seed, getrennt vom Web)
- `deploy/nginx/` – Nginx-vHost
- `scripts/deploy-vps.sh` – Deploy auf den VPS

## Lokal

```bash
cd web
npm ci
npm run dev
```

Öffnen: http://localhost:3100

## Deploy

Benötigt Umgebungsvariablen `VPS_HOST`, `VPS_USER`, `VPS_PASSWORD`, optional `VPS_PORT`.

```bash
./scripts/deploy-vps.sh
```

## Branding

- Primär: `#005192` (Sperger-Blau aus dem Firmenlogo)
- Sekundär: `#5a6670` (Slate)
- Schriften: Barlow Condensed + Manrope
- Logo/Hero: Assets unter `web/public/`
