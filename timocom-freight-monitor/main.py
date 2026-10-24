#!/usr/bin/env python3
"""
Timocom Freight Monitor
- Alle N Minuten: Routen suchen
  1) Ulm (Umkreis) → Vorarlberg
  2) Vorarlberg → Schweiz
  3) Schweiz → Vorarlberg
  4) Schweiz → Österreich (ganz AT, max. 6 Lademeter)
- Excel + HTML inkl. Anbieter und Mustererkennung
- Täglich gegen 18:00 (Europe/Berlin): E-Mail-Zusammenfassung
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import schedule
from dotenv import load_dotenv

from analytics import analytics_for_routes
from excel_store import ExcelStore
from mailer import build_summary_html, send_email
from timocom_client import TimocomClient, build_location
from web_report import write_analytics_html, write_hub_html, write_index_html

ROOT = Path(__file__).resolve().parent
LOG = logging.getLogger("timocom-freight-monitor")

VLBG_PREFIXES = ["67", "68", "69"]


def env_bool(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


def _split_csv(value: str) -> list[str]:
    return [p.strip() for p in value.split(",") if p.strip()]


def format_location_label(spec: dict[str, Any]) -> str:
    if spec["mode"] == "area":
        return (
            f"{spec['city']} ({spec['country']} {spec['postal_code']}, "
            f"{spec['radius_km']} km)"
        )
    prefixes = spec.get("postal_prefixes") or []
    if not prefixes:
        return f"{spec.get('label') or spec['country']} (ganz {spec['country']})"
    region = spec.get("label") or spec["country"]
    return f"{region} ({spec['country']} PLZ {','.join(prefixes)})"


def format_filter_label(route: dict[str, Any]) -> str:
    parts = []
    if route.get("length_max_m") is not None:
        parts.append(f"max. {route['length_max_m']} Lademeter")
    if route.get("length_min_m") is not None:
        parts.append(f"min. {route['length_min_m']} Lademeter")
    return ", ".join(parts)


def default_routes(data_dir: Path) -> list[dict[str, Any]]:
    """Standard-Routen inkl. Excel-/HTML-Pfaden."""
    ulm_radius = int(os.getenv("ORIGIN_RADIUS_KM", "30"))
    vlbg = _split_csv(os.getenv("DEST_POSTAL_PREFIXES", ",".join(VLBG_PREFIXES))) or list(
        VLBG_PREFIXES
    )
    ch_at_max_m = float(os.getenv("CH_AT_MAX_LENGTH_M", "6"))

    routes = [
        {
            "id": "ulm_vorarlberg",
            "title": "Ulm → Vorarlberg",
            "mail_prefix": "[Timocom Ulm→Vorarlberg]",
            "start": {
                "mode": "area",
                "country": os.getenv("ORIGIN_COUNTRY", "DE"),
                "city": os.getenv("ORIGIN_CITY", "Ulm"),
                "postal_code": os.getenv("ORIGIN_POSTAL_CODE", "89073"),
                "radius_km": ulm_radius,
            },
            "dest": {
                "mode": "postal",
                "country": "AT",
                "postal_prefixes": vlbg,
                "label": "Vorarlberg",
            },
            "excel_file": "frachten_ulm_vorarlberg.xlsx",
            "html_file": "route_ulm_vorarlberg.html",
        },
        {
            "id": "ulm_schweiz",
            "title": "Ulm → Schweiz",
            "mail_prefix": "[Timocom Ulm→Schweiz]",
            "start": {
                "mode": "area",
                "country": os.getenv("ORIGIN_COUNTRY", "DE"),
                "city": os.getenv("ORIGIN_CITY", "Ulm"),
                "postal_code": os.getenv("ORIGIN_POSTAL_CODE", "89073"),
                "radius_km": ulm_radius,
            },
            "dest": {
                "mode": "postal",
                "country": "CH",
                "postal_prefixes": [],  # ganzes Land
                "label": "Schweiz",
            },
            "excel_file": "frachten_ulm_schweiz.xlsx",
            "html_file": "route_ulm_schweiz.html",
        },
        {
            "id": "vorarlberg_schweiz",
            "title": "Vorarlberg → Schweiz",
            "mail_prefix": "[Timocom Vorarlberg→Schweiz]",
            "start": {
                "mode": "postal",
                "country": "AT",
                "postal_prefixes": vlbg,
                "label": "Vorarlberg",
            },
            "dest": {
                "mode": "postal",
                "country": "CH",
                "postal_prefixes": [],  # leere Liste = ganzes Land
                "label": "Schweiz",
            },
            "excel_file": "frachten_vorarlberg_schweiz.xlsx",
            "html_file": "route_vorarlberg_schweiz.html",
        },
        {
            "id": "schweiz_vorarlberg",
            "title": "Schweiz → Vorarlberg",
            "mail_prefix": "[Timocom Schweiz→Vorarlberg]",
            "start": {
                "mode": "postal",
                "country": "CH",
                "postal_prefixes": [],
                "label": "Schweiz",
            },
            "dest": {
                "mode": "postal",
                "country": "AT",
                "postal_prefixes": vlbg,
                "label": "Vorarlberg",
            },
            "excel_file": "frachten_schweiz_vorarlberg.xlsx",
            "html_file": "route_schweiz_vorarlberg.html",
        },
        {
            "id": "schweiz_oesterreich",
            "title": "Schweiz → Österreich (≤6 m)",
            "mail_prefix": "[Timocom Schweiz→Österreich ≤6m]",
            "start": {
                "mode": "postal",
                "country": "CH",
                "postal_prefixes": [],
                "label": "Schweiz",
            },
            "dest": {
                "mode": "postal",
                "country": "AT",
                "postal_prefixes": [],  # ganz Österreich
                "label": "Österreich",
            },
            "length_max_m": ch_at_max_m,
            "excel_file": "frachten_schweiz_oesterreich.xlsx",
            "html_file": "route_schweiz_oesterreich.html",
        },
    ]

    for route in routes:
        route["excel_path"] = data_dir / route["excel_file"]
        route["html_path"] = data_dir / route["html_file"]
        route["origin_label"] = format_location_label(route["start"])
        dest_label = format_location_label(route["dest"])
        filt = format_filter_label(route)
        route["dest_label"] = f"{dest_label}, {filt}" if filt else dest_label
    return routes


def load_config() -> dict:
    load_dotenv(ROOT / ".env")
    username = os.getenv("TIMOCOM_USERNAME", "").strip()
    password = os.getenv("TIMOCOM_PASSWORD", "").strip()
    if not username or not password:
        raise SystemExit(
            "TIMOCOM_USERNAME und TIMOCOM_PASSWORD fehlen. "
            "Bitte .env anhand von .env.example anlegen."
        )

    data_dir = Path(os.getenv("DATA_DIR", str(ROOT / "data")))
    if not data_dir.is_absolute():
        data_dir = ROOT / data_dir

    routes = default_routes(data_dir)
    only = os.getenv("ROUTES", "").strip()
    if only:
        wanted = set(_split_csv(only))
        routes = [r for r in routes if r["id"] in wanted]
        if not routes:
            raise SystemExit(f"ROUTES filterte alles weg: {only}")

    return {
        "username": username,
        "password": password,
        "base_url": os.getenv(
            "TIMOCOM_BASE_URL", "https://api.timocom.com/freight-exchange/3"
        ),
        "interval": int(os.getenv("SEARCH_INTERVAL_MINUTES", "30")),
        "max_results": int(os.getenv("MAX_RESULTS", "30")),
        "data_dir": data_dir,
        "hub_html": data_dir / "index.html",
        "analytics_html": data_dir / "analytics.html",
        "routes": routes,
        "tz_name": os.getenv("TIMEZONE", "Europe/Berlin"),
        "summary_hour": int(os.getenv("SUMMARY_HOUR", "18")),
        "summary_minute": int(os.getenv("SUMMARY_MINUTE", "0")),
        "smtp_host": os.getenv("SMTP_HOST", "").strip(),
        "smtp_port": int(os.getenv("SMTP_PORT", "587")),
        "smtp_user": os.getenv("SMTP_USER", "").strip(),
        "smtp_password": os.getenv("SMTP_PASSWORD", "").strip(),
        "smtp_tls": env_bool("SMTP_USE_TLS", True),
        "mail_from": os.getenv("MAIL_FROM", "").strip(),
        "mail_to": os.getenv("MAIL_TO", "").strip(),
    }


def setup_logging(data_dir: Path) -> None:
    data_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(data_dir / "monitor.log", encoding="utf-8"),
        ],
    )


def refresh_web_report(cfg: dict, route: dict, store: ExcelStore) -> None:
    path = write_index_html(
        store.path,
        route["html_path"],
        origin_label=route["origin_label"],
        dest_label=route["dest_label"],
        title=f"Timocom Frachten – {route['title']}",
        tz_name=cfg["tz_name"],
        routes=cfg["routes"],
        active_route_id=route["id"],
    )
    LOG.info("[%s] Webseite aktualisiert: %s", route["id"], path)


def refresh_hub(cfg: dict) -> None:
    stats = analytics_for_routes(cfg["routes"])
    path = write_hub_html(
        cfg["hub_html"],
        cfg["routes"],
        tz_name=cfg["tz_name"],
        analytics=stats["overall"],
    )
    analytics_path = write_analytics_html(
        cfg["analytics_html"],
        cfg["routes"],
        stats,
        tz_name=cfg["tz_name"],
    )
    LOG.info("Hub aktualisiert: %s", path)
    LOG.info("Analytics aktualisiert: %s", analytics_path)


def fetch_all_offers(client: TimocomClient, route: dict, max_results: int) -> list[dict]:
    start = build_location(route["start"])
    dest = build_location(route["dest"])
    length_min = route.get("length_min_m")
    length_max = route.get("length_max_m")
    offers = client.search_freight_offers(
        start_location=start,
        destination_location=dest,
        max_results=max_results,
        length_min_m=length_min,
        length_max_m=length_max,
    )
    all_offers = list(offers)
    first = max_results
    while len(offers) == min(max_results, 30) and first < 150:
        offers = client.search_freight_offers(
            start_location=start,
            destination_location=dest,
            max_results=max_results,
            first_result=first,
            length_min_m=length_min,
            length_max_m=length_max,
        )
        if not offers:
            break
        all_offers.extend(offers)
        first += min(max_results, 30)

    by_id = {}
    for offer in all_offers:
        oid = offer.get("id")
        if oid:
            by_id[oid] = offer
    return list(by_id.values())


def run_search_route(
    cfg: dict,
    route: dict,
    store: ExcelStore,
    client: TimocomClient,
) -> None:
    run_id = (
        datetime.now(ZoneInfo(cfg["tz_name"])).strftime("%Y%m%d-%H%M%S")
        + "-"
        + uuid.uuid4().hex[:6]
    )
    LOG.info(
        "[%s] Suchlauf %s: %s → %s",
        route["id"],
        run_id,
        route["origin_label"],
        route["dest_label"],
    )
    try:
        unique = fetch_all_offers(client, route, cfg["max_results"])
        neu, aktualisiert = store.upsert_offers(unique, run_id=run_id)
        store.log_run(run_id, treffer=len(unique), neu=neu, aktualisiert=aktualisiert)
        refresh_web_report(cfg, route, store)
        LOG.info(
            "[%s] fertig: %s Treffer, %s neu, %s aktualisiert → %s",
            route["id"],
            len(unique),
            neu,
            aktualisiert,
            store.path,
        )
    except Exception as exc:
        LOG.exception("[%s] Suchlauf fehlgeschlagen: %s", route["id"], exc)
        store.log_run(run_id, treffer=0, neu=0, aktualisiert=0, fehler=str(exc)[:500])


def run_all_searches(cfg: dict, stores: dict[str, ExcelStore], client: TimocomClient) -> None:
    for route in cfg["routes"]:
        run_search_route(cfg, route, stores[route["id"]], client)
    refresh_hub(cfg)


def run_daily_summary(cfg: dict, stores: dict[str, ExcelStore]) -> None:
    tz = ZoneInfo(cfg["tz_name"])
    day = datetime.now(tz).strftime("%Y-%m-%d")
    LOG.info("Erzeuge Tageszusammenfassung für %s", day)

    parts: list[str] = []
    total_new = 0
    for route in cfg["routes"]:
        store = stores[route["id"]]
        new_offers = store.offers_found_on_date(day)
        seen_offers = store.all_offers_seen_on_date(day)
        total_new += len(new_offers)
        parts.append(
            build_summary_html(
                day=day,
                new_offers=new_offers,
                seen_offers=seen_offers,
                origin_label=route["origin_label"],
                dest_label=route["dest_label"],
                excel_path=str(store.path),
            )
        )
        # Abschnittstitel einfügen
        parts[-1] = parts[-1].replace(
            f"<h2>Timocom-Frachtsuche – Tageszusammenfassung {day}</h2>",
            f"<h2>{route['title']} – {day}</h2>",
            1,
        )

    combined = (
        "<html><body style='font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222'>"
        f"<h1>Timocom Frachten – Tageszusammenfassung {day}</h1>"
        f"<p><b>Neu gesamt:</b> {total_new}</p>"
        + "<hr>".join(parts)
        + "</body></html>"
    )
    # innere html/body der Teile entfernen wäre schöner – für Mail reicht verschachtelt
    subject = f"[Timocom Frachten] Zusammenfassung {day} – {total_new} neu"

    if not cfg["smtp_host"] or not cfg["mail_to"]:
        summary_file = cfg["data_dir"] / f"summary_{day}.html"
        summary_file.write_text(combined, encoding="utf-8")
        LOG.warning(
            "SMTP nicht konfiguriert – Zusammenfassung nur lokal gespeichert: %s",
            summary_file,
        )
        return

    try:
        send_email(
            smtp_host=cfg["smtp_host"],
            smtp_port=cfg["smtp_port"],
            smtp_user=cfg["smtp_user"],
            smtp_password=cfg["smtp_password"],
            use_tls=cfg["smtp_tls"],
            mail_from=cfg["mail_from"] or cfg["smtp_user"],
            mail_to=cfg["mail_to"],
            subject=subject,
            html_body=combined,
        )
        LOG.info("Zusammenfassungs-Mail an %s gesendet.", cfg["mail_to"])
    except Exception as exc:
        LOG.exception("Mailversand fehlgeschlagen: %s", exc)
        summary_file = cfg["data_dir"] / f"summary_{day}.html"
        summary_file.write_text(combined, encoding="utf-8")
        LOG.info("Fallback: HTML gespeichert unter %s", summary_file)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Timocom Freight Monitor (Ulm↔Vorarlberg↔Schweiz)"
    )
    parser.add_argument("--once", action="store_true", help="Nur einen Suchlauf ausführen")
    parser.add_argument(
        "--summary-now", action="store_true", help="Tageszusammenfassung sofort senden"
    )
    parser.add_argument(
        "--refresh-web",
        action="store_true",
        help="HTML-Übersichten aus bestehender Excel neu erzeugen (ohne Suche)",
    )
    parser.add_argument(
        "--route",
        action="append",
        dest="route_ids",
        help="Nur diese Route(n) (id), mehrfach möglich",
    )
    args = parser.parse_args()

    cfg = load_config()
    if args.route_ids:
        wanted = set(args.route_ids)
        cfg["routes"] = [r for r in cfg["routes"] if r["id"] in wanted]
        if not cfg["routes"]:
            raise SystemExit(f"Keine passenden Routen für: {args.route_ids}")

    setup_logging(cfg["data_dir"])
    tz = ZoneInfo(cfg["tz_name"])
    stores = {
        route["id"]: ExcelStore(route["excel_path"], tz=tz) for route in cfg["routes"]
    }
    client = TimocomClient(cfg["base_url"], cfg["username"], cfg["password"])

    if args.refresh_web:
        for route in cfg["routes"]:
            refresh_web_report(cfg, route, stores[route["id"]])
        refresh_hub(cfg)
        return

    if args.summary_now:
        run_daily_summary(cfg, stores)
        return

    if args.once:
        run_all_searches(cfg, stores, client)
        return

    LOG.info(
        "Monitor gestartet: %s Routen, alle %s Min, Zusammenfassung %02d:%02d %s",
        len(cfg["routes"]),
        cfg["interval"],
        cfg["summary_hour"],
        cfg["summary_minute"],
        cfg["tz_name"],
    )
    for route in cfg["routes"]:
        LOG.info("  - %s: %s → %s", route["id"], route["origin_label"], route["dest_label"])

    run_all_searches(cfg, stores, client)

    schedule.every(cfg["interval"]).minutes.do(
        run_all_searches, cfg=cfg, stores=stores, client=client
    )
    schedule.every().day.at(
        f"{cfg['summary_hour']:02d}:{cfg['summary_minute']:02d}",
        cfg["tz_name"],
    ).do(run_daily_summary, cfg=cfg, stores=stores)

    while True:
        schedule.run_pending()
        time.sleep(20)


if __name__ == "__main__":
    main()
