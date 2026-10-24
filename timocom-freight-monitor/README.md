# Timocom Freight Monitor

Sucht automatisch Frachten auf TIMOCOM und schreibt alle Details in Excel + HTML.

## Routen

| ID | Richtung | Dateien |
|----|----------|---------|
| `ulm_vorarlberg` | Ulm (30 km) → Vorarlberg (AT 67/68/69) | `frachten_ulm_vorarlberg.xlsx` |
| `ulm_schweiz` | Ulm (30 km) → Schweiz (ganz CH) | `frachten_ulm_schweiz.xlsx` |
| `vorarlberg_schweiz` | Vorarlberg → Schweiz (ganz CH) | `frachten_vorarlberg_schweiz.xlsx` |
| `schweiz_vorarlberg` | Schweiz → Vorarlberg | `frachten_schweiz_vorarlberg.xlsx` |
| `schweiz_oesterreich` | Schweiz → Österreich (ganz AT), **max. 6 Lademeter** | `frachten_schweiz_oesterreich.xlsx` |

- Hub: `data/index.html` (alle Tabellen + Kurz-Stats)
- Mustererkennung: `data/analytics.html` (Wochentage, Preise, Top-Anbieter, Destinationen)

## Funktionen

- Suche **alle 30 Minuten** für alle Routen
- Excel mit **allen API-Details** inkl. **Anbieter** (Timocom-ID + Name)
- HTML-Übersicht pro Route + Hub + Analytics
- **Mustererkennung** aus der Historie:
  - stärkster Wochentag
  - Durchschnittspreise (wenn angegeben)
  - Top-Anbieter
  - häufigste Start-/Zielorte
- Täglich gegen **18:00 Uhr (Europe/Berlin)** E-Mail-Zusammenfassung

## Produktion (VPS)

- Host: `https://timo.logistikberater.at/`
- Pfad: `/opt/timocom-freight-monitor` (getrennt von Sperger/WOG)
- Deploy: `./scripts/deploy-timo-vps.sh` (Repo-Root)
- Service: `timocom-freight-monitor.service`
- Nginx liefert `data/*.html` aus

## Installation (lokal)

```bash
cd timocom-freight-monitor
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# .env ausfüllen (TIMOCOM_*, SMTP_*)
```

## Start

Alle Routen einmal:

```bash
python main.py --once
```

Nur eine Route:

```bash
python main.py --once --route schweiz_oesterreich
```

Dauerbetrieb:

```bash
python main.py
```

```bash
python main.py --summary-now
python main.py --refresh-web
```

## Excel

Pro Route eine Datei unter `data/`:

| Blatt | Inhalt |
|-------|--------|
| **Frachten** | Alle Treffer, dedupliziert nach `offer_id` |
| **Suchlaeufe** | Protokoll jedes Suchlaufs |

## E-Mail

Ohne SMTP wird die Zusammenfassung als HTML unter `data/summary_YYYY-MM-DD.html` abgelegt.
