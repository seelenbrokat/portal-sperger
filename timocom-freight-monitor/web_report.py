"""Erzeugt HTML-Übersichtsseiten inkl. Anbieter und Routen-Navigation."""

from __future__ import annotations

import html
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from openpyxl import load_workbook


DISPLAY_COLUMNS = [
    ("anbieter_timocom_id", "Timocom-ID"),
    ("anbieter_name", "Anbieter"),
    ("anbieter_ort", "Anbieter-Ort"),
    ("anbieter_telefon", "Anbieter-Telefon"),
    ("loading_country", "Von-Land"),
    ("loading_postal_code", "Von-PLZ"),
    ("loading_city", "Von"),
    ("unloading_country", "Nach-Land"),
    ("unloading_postal_code", "Nach-PLZ"),
    ("unloading_city", "Nach"),
    ("loading_earliest_date", "Laden ab"),
    ("unloading_earliest_date", "Entladen ab"),
    ("weight_t", "Gewicht (t)"),
    ("length_m", "Länge (m)"),
    ("distance_km", "km"),
    ("vehicle_body", "Aufbau"),
    ("vehicle_type", "Fahrzeugtyp"),
    ("freight_description", "Beschreibung"),
    ("price_amount", "Preis"),
    ("price_currency", "Währung"),
    ("contact_first_name", "Kontakt Vorname"),
    ("contact_last_name", "Kontakt Name"),
    ("contact_email", "Kontakt E-Mail"),
    ("contact_phone", "Kontakt Telefon"),
    ("deeplink", "Timocom-Link"),
    ("erstmals_gefunden", "Erstmals gefunden"),
    ("zuletzt_gesehen", "Zuletzt gesehen"),
]

COMMON_CSS = """
    :root {
      --bg: #f4f6f8;
      --card: #ffffff;
      --ink: #1a2332;
      --muted: #5b6775;
      --line: #d5dde5;
      --accent: #0069b4;
      --accent-soft: #e8f2fa;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.45;
    }
    header {
      background: var(--accent);
      color: #fff;
      padding: 24px 32px 0;
    }
    header h1 {
      margin: 0 0 8px;
      font-size: 1.6rem;
      font-weight: 700;
    }
    header .sub { margin: 0 0 16px; opacity: 0.92; }
    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 0 -4px;
    }
    .nav a {
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      padding: 10px 14px;
      border-radius: 8px 8px 0 0;
      opacity: 0.85;
      background: transparent;
    }
    .nav a:hover { opacity: 1; background: rgba(255,255,255,0.12); }
    .nav a.active {
      opacity: 1;
      background: var(--bg);
      color: var(--accent);
    }
    main { padding: 24px 32px 48px; }
    .stats {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .stat {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px 18px;
      min-width: 140px;
    }
    .stat strong {
      display: block;
      font-size: 1.5rem;
      color: var(--accent);
    }
    .stat span { color: var(--muted); font-size: 0.9rem; }
    .note {
      background: var(--accent-soft);
      border-left: 4px solid var(--accent);
      padding: 12px 16px;
      margin-bottom: 20px;
      border-radius: 0 8px 8px 0;
    }
    .section { margin-bottom: 36px; }
    .section h2 {
      margin: 0 0 6px;
      font-size: 1.25rem;
      color: var(--accent);
    }
    .section .meta { margin: 0 0 12px; color: var(--muted); }
    .grid-2 {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      margin-bottom: 24px;
    }
    .panel {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px 18px;
    }
    .panel h3 { margin: 0 0 12px; font-size: 1.05rem; }
    .bars { display: flex; flex-direction: column; gap: 8px; }
    .bar-row { display: grid; grid-template-columns: 100px 1fr 36px; gap: 8px; align-items: center; }
    .bar-label { color: var(--muted); font-size: 0.9rem; }
    .bar-track { background: #e8eef3; border-radius: 4px; height: 12px; overflow: hidden; }
    .bar-fill { display: block; height: 100%; background: var(--accent); }
    .bar-n { text-align: right; font-weight: 600; }
    .table-wrap {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: auto;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      min-width: 1400px;
      font-size: 0.92rem;
    }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      white-space: nowrap;
    }
    th {
      position: sticky;
      top: 0;
      background: #0f3d66;
      color: #fff;
      font-weight: 600;
      z-index: 1;
    }
    th:nth-child(1), th:nth-child(2),
    td:nth-child(1), td:nth-child(2) {
      background: #eef6fc;
      position: sticky;
      left: 0;
      z-index: 2;
    }
    th:nth-child(1), th:nth-child(2) {
      background: #0a2f52;
      z-index: 3;
    }
    th:nth-child(2), td:nth-child(2) { left: 110px; }
    tr:hover td { background: #f7fafc; }
    tr:hover td:nth-child(1), tr:hover td:nth-child(2) { background: #e3f0fa; }
    code {
      background: #e8eef3;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }
    a { color: var(--accent); font-weight: 600; }
    footer {
      margin-top: 16px;
      color: var(--muted);
      font-size: 0.85rem;
    }
"""


def _load_offers(excel_path: Path) -> list[dict[str, Any]]:
    if not excel_path.exists():
        return []
    wb = load_workbook(excel_path, read_only=True, data_only=True)
    ws = wb["Frachten"]
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    if not rows:
        return []
    headers = [str(h) for h in rows[0]]
    offers = []
    for row in rows[1:]:
        if not row or not row[0]:
            continue
        offers.append(dict(zip(headers, row)))
    offers.sort(key=lambda o: str(o.get("zuletzt_gesehen") or ""), reverse=True)
    return offers


def _cell(o: dict[str, Any], key: str) -> str:
    val = o.get(key)
    if val is None or val == "":
        return "—"
    text = html.escape(str(val))
    if key == "deeplink" and str(val).startswith("http"):
        return f'<a href="{html.escape(str(val))}" target="_blank" rel="noopener">Öffnen</a>'
    if key == "anbieter_name":
        return f"<strong>{text}</strong>"
    if key == "anbieter_timocom_id":
        return f"<code>{text}</code>"
    return text


def _table_html(offers: list[dict[str, Any]]) -> str:
    header_cells = "".join(f"<th>{html.escape(label)}</th>" for _, label in DISPLAY_COLUMNS)
    if not offers:
        body = f'<tr><td colspan="{len(DISPLAY_COLUMNS)}">Noch keine Treffer.</td></tr>'
    else:
        rows = []
        for o in offers:
            tds = "".join(f"<td>{_cell(o, key)}</td>" for key, _ in DISPLAY_COLUMNS)
            rows.append(f"<tr>{tds}</tr>")
        body = "\n".join(rows)
    return f"""<div class="table-wrap">
      <table>
        <thead><tr>{header_cells}</tr></thead>
        <tbody>
{body}
        </tbody>
      </table>
    </div>"""


def _nav_html(
    routes: list[dict[str, Any]],
    active_id: str | None,
    *,
    analytics_active: bool = False,
) -> str:
    items = [
        f'<a href="index.html" class="{"active" if active_id is None and not analytics_active else ""}">Alle Routen</a>',
        f'<a href="analytics.html" class="{"active" if analytics_active else ""}">Muster / Stats</a>',
    ]
    for r in routes:
        href = html.escape(Path(r["html_path"]).name)
        title = html.escape(r["title"])
        cls = "active" if r["id"] == active_id else ""
        items.append(f'<a href="{href}" class="{cls}">{title}</a>')
    return '<nav class="nav">' + "".join(items) + "</nav>"


def _ranking_table(rows: list[dict[str, Any]], name_label: str) -> str:
    if not rows:
        return "<p class='meta'>Noch keine Daten.</p>"
    body = "".join(
        f"<tr><td>{html.escape(str(r['name']))}</td><td>{r['count']}</td></tr>" for r in rows
    )
    return f"""<div class="table-wrap" style="min-width:0">
      <table style="min-width:0">
        <thead><tr><th>{html.escape(name_label)}</th><th>Anzahl</th></tr></thead>
        <tbody>{body}</tbody>
      </table>
    </div>"""


def _weekday_bars(weekday_counts: list[dict[str, Any]]) -> str:
    if not weekday_counts:
        return ""
    max_c = max((r["count"] for r in weekday_counts), default=0) or 1
    bars = []
    for r in weekday_counts:
        width = int(round(100 * r["count"] / max_c)) if max_c else 0
        bars.append(
            f"""<div class="bar-row">
          <span class="bar-label">{html.escape(r['weekday'])}</span>
          <span class="bar-track"><span class="bar-fill" style="width:{width}%"></span></span>
          <span class="bar-n">{r['count']}</span>
        </div>"""
        )
    return "<div class='bars'>" + "".join(bars) + "</div>"


def _analytics_summary_html(analytics: dict[str, Any] | None) -> str:
    if not analytics:
        return ""
    strongest = analytics.get("strongest_weekday")
    strong_txt = (
        f"{strongest['weekday']} ({strongest['count']})"
        if strongest
        else "noch unklar"
    )
    avg = analytics.get("avg_price")
    avg_txt = f"{avg} EUR" if avg is not None else "keine Preisangaben"
    with_price = analytics.get("with_price", 0)
    total = analytics.get("total_offers", 0)
    top_p = analytics.get("top_providers") or []
    top_d = analytics.get("top_destinations") or []
    top_p_txt = ", ".join(f"{p['name']} ({p['count']})" for p in top_p[:3]) or "—"
    top_d_txt = ", ".join(f"{d['name']} ({d['count']})" for d in top_d[:3]) or "—"
    return f"""
    <section class="section" id="muster">
      <h2><a href="analytics.html">Mustererkennung</a></h2>
      <p class="meta">Je mehr Suchläufe, desto stabiler die Auswertung (aktuell {total} Angebote).</p>
      <div class="stats">
        <div class="stat"><strong>{html.escape(strong_txt)}</strong><span>Stärkster Wochentag</span></div>
        <div class="stat"><strong>{html.escape(avg_txt)}</strong><span>Ø Preis ({with_price} mit Preis)</span></div>
      </div>
      <p><strong>Top-Anbieter:</strong> {html.escape(top_p_txt)}</p>
      <p><strong>Häufigste Ziele:</strong> {html.escape(top_d_txt)}</p>
      <p class="meta"><a href="analytics.html">Alle Stats öffnen →</a></p>
    </section>"""


def build_index_html(
    excel_path: Path,
    *,
    origin_label: str,
    dest_label: str,
    title: str = "Timocom Frachten",
    tz_name: str = "Europe/Berlin",
    routes: list[dict[str, Any]] | None = None,
    active_route_id: str | None = None,
) -> str:
    offers = _load_offers(excel_path)
    now = datetime.now(ZoneInfo(tz_name)).strftime("%Y-%m-%d %H:%M:%S %Z")
    provider_count = len(
        {str(o.get("anbieter_timocom_id")) for o in offers if o.get("anbieter_timocom_id")}
    )
    page_title = html.escape(title)
    nav = _nav_html(routes or [], active_route_id)

    return f"""<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="300" />
  <title>{page_title}</title>
  <style>{COMMON_CSS}</style>
</head>
<body>
  <header>
    <h1>{page_title}</h1>
    <p class="sub">{html.escape(origin_label)} → {html.escape(dest_label)}</p>
    {nav}
  </header>
  <main>
    <div class="stats">
      <div class="stat"><strong>{len(offers)}</strong><span>Treffer</span></div>
      <div class="stat"><strong>{provider_count}</strong><span>Anbieter</span></div>
      <div class="stat"><strong>{html.escape(now)}</strong><span>Stand (Europe/Berlin)</span></div>
    </div>
    <div class="note">
      Anbieter (Timocom-ID + Name) in den ersten Spalten.
      Stats unter <a href="analytics.html">Muster / Stats</a>.
    </div>
    {_table_html(offers)}
    <footer>
      Quelle: {html.escape(str(excel_path.name))} · Seite aktualisiert sich alle 5 Minuten automatisch.
    </footer>
  </main>
</body>
</html>
"""


def write_index_html(
    excel_path: Path,
    html_path: Path,
    *,
    origin_label: str,
    dest_label: str,
    title: str = "Timocom Frachten",
    tz_name: str = "Europe/Berlin",
    routes: list[dict[str, Any]] | None = None,
    active_route_id: str | None = None,
) -> Path:
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_text(
        build_index_html(
            excel_path,
            origin_label=origin_label,
            dest_label=dest_label,
            title=title,
            tz_name=tz_name,
            routes=routes,
            active_route_id=active_route_id,
        ),
        encoding="utf-8",
    )
    return html_path


def write_hub_html(
    html_path: Path,
    routes: list[dict[str, Any]],
    *,
    tz_name: str = "Europe/Berlin",
    analytics: dict[str, Any] | None = None,
) -> Path:
    """Startseite: Navigation + Muster-Kurzüberblick + alle Routen-Tabellen."""
    now = datetime.now(ZoneInfo(tz_name)).strftime("%Y-%m-%d %H:%M:%S %Z")
    nav = _nav_html(routes, active_id=None)

    total = 0
    sections = []
    for r in routes:
        offers = _load_offers(Path(r["excel_path"]))
        total += len(offers)
        href = html.escape(Path(r["html_path"]).name)
        sections.append(
            f"""
    <section class="section" id="{html.escape(r['id'])}">
      <h2><a href="{href}">{html.escape(r['title'])}</a> · {len(offers)} Treffer</h2>
      <p class="meta">{html.escape(r['origin_label'])} → {html.escape(r['dest_label'])}</p>
      {_table_html(offers)}
    </section>"""
        )

    route_titles = " · ".join(html.escape(r["title"]) for r in routes)
    content = f"""<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="300" />
  <title>Timocom Frachten – Alle Routen</title>
  <style>{COMMON_CSS}</style>
</head>
<body>
  <header>
    <h1>Timocom Frachten – Alle Routen</h1>
    <p class="sub">{route_titles}</p>
    {nav}
  </header>
  <main>
    <div class="stats">
      <div class="stat"><strong>{total}</strong><span>Treffer gesamt</span></div>
      <div class="stat"><strong>{len(routes)}</strong><span>Routen</span></div>
      <div class="stat"><strong>{html.escape(now)}</strong><span>Stand (Europe/Berlin)</span></div>
    </div>
    {_analytics_summary_html(analytics)}
{"".join(sections)}
    <footer>Seite aktualisiert sich alle 5 Minuten automatisch.</footer>
  </main>
</body>
</html>
"""
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_text(content, encoding="utf-8")
    return html_path


def write_analytics_html(
    html_path: Path,
    routes: list[dict[str, Any]],
    stats: dict[str, Any],
    *,
    tz_name: str = "Europe/Berlin",
) -> Path:
    """Eigene Seite für Mustererkennung / Kennzahlen."""
    now = datetime.now(ZoneInfo(tz_name)).strftime("%Y-%m-%d %H:%M:%S %Z")
    nav = _nav_html(routes, active_id="__analytics__", analytics_active=True)
    overall = stats.get("overall") or {}
    strongest = overall.get("strongest_weekday")
    strong_txt = (
        f"{strongest['weekday']} ({strongest['count']} Treffer)"
        if strongest
        else "noch unklar – mehr Historie nötig"
    )
    avg = overall.get("avg_price")
    avg_txt = f"{avg}" if avg is not None else "—"
    price_note = ""
    for cur, info in (overall.get("price_by_currency") or {}).items():
        price_note += (
            f"<li>{html.escape(cur)}: Ø {info['avg']} "
            f"(n={info['count']}, min {info['min']}, max {info['max']})</li>"
        )
    if not price_note:
        price_note = "<li>Keine Preise in den aktuellen Treffern.</li>"

    by_route_blocks = []
    for route in routes:
        rstats = (stats.get("by_route") or {}).get(route["id"]) or {}
        r_strong = rstats.get("strongest_weekday")
        r_strong_txt = (
            f"{r_strong['weekday']} ({r_strong['count']})" if r_strong else "—"
        )
        by_route_blocks.append(
            f"""
      <div class="panel">
        <h3>{html.escape(route['title'])}</h3>
        <p class="meta">{rstats.get('total_offers', 0)} Angebote ·
           stärkster Tag: {html.escape(r_strong_txt)} ·
           Ø Preis: {rstats.get('avg_price') if rstats.get('avg_price') is not None else '—'}</p>
        {_weekday_bars(rstats.get('weekday_counts') or [])}
      </div>"""
        )

    content = f"""<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="300" />
  <title>Timocom Frachten – Muster / Stats</title>
  <style>{COMMON_CSS}</style>
</head>
<body>
  <header>
    <h1>Mustererkennung / Stats</h1>
    <p class="sub">Wochentage, Preise, Top-Anbieter, häufigste Ziele – Stand {html.escape(now)}</p>
    {nav}
  </header>
  <main>
    <div class="note">
      Auswertung über alle gespeicherten Angebote. Mit der Zeit (viele Suchläufe)
      werden Muster wie der stärkste Wochentag aussagekräftiger.
    </div>
    <div class="stats">
      <div class="stat"><strong>{overall.get('total_offers', 0)}</strong><span>Angebote gesamt</span></div>
      <div class="stat"><strong>{html.escape(strong_txt)}</strong><span>Stärkster Wochentag</span></div>
      <div class="stat"><strong>{html.escape(str(avg_txt))}</strong><span>Ø Preis</span></div>
      <div class="stat"><strong>{overall.get('avg_length_m') if overall.get('avg_length_m') is not None else '—'}</strong><span>Ø Lademeter</span></div>
      <div class="stat"><strong>{overall.get('avg_weight_t') if overall.get('avg_weight_t') is not None else '—'}</strong><span>Ø Gewicht (t)</span></div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <h3>Treffer nach Wochentag (erstmals gefunden)</h3>
        {_weekday_bars(overall.get('weekday_counts') or [])}
      </div>
      <div class="panel">
        <h3>Preise</h3>
        <ul>{price_note}</ul>
        <p class="meta">Nur Angebote mit Preisangabe ({overall.get('with_price', 0)}).</p>
      </div>
      <div class="panel">
        <h3>Top-Anbieter</h3>
        {_ranking_table(overall.get('top_providers') or [], "Anbieter")}
      </div>
      <div class="panel">
        <h3>Häufigste Destinationen</h3>
        {_ranking_table(overall.get('top_destinations') or [], "Ziel")}
      </div>
      <div class="panel">
        <h3>Häufigste Abholorte</h3>
        {_ranking_table(overall.get('top_origins') or [], "Start")}
      </div>
    </div>

    <section class="section">
      <h2>Pro Route</h2>
      <div class="grid-2">
{"".join(by_route_blocks)}
      </div>
    </section>
    <footer>Quelle: Excel-Dateien der Routen · aktualisiert nach jedem Suchlauf</footer>
  </main>
</body>
</html>
"""
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_text(content, encoding="utf-8")
    return html_path
