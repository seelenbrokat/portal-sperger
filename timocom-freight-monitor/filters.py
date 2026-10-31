"""Dauerhafte Filter: ausgeblendete Angebote/Auftraggeber + Watchlist-Firmen."""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

DEFAULT_WATCHED = [
    {"label": "Tisa", "match": "tisa"},
    {"label": "WOG Logistics", "match": "wog logistics"},
]

FILTERS_VERSION = 1


def default_filters() -> dict[str, Any]:
    return {
        "version": FILTERS_VERSION,
        "hidden_offers": [],
        "hidden_shippers": [],
        "watched_shippers": [dict(w) for w in DEFAULT_WATCHED],
    }


def filters_path(data_dir: Path) -> Path:
    return Path(data_dir) / "filters.json"


def load_filters(data_dir: Path) -> dict[str, Any]:
    path = filters_path(data_dir)
    if not path.exists():
        data = default_filters()
        save_filters(data_dir, data)
        return data
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default_filters()
    if not isinstance(raw, dict):
        return default_filters()
    base = default_filters()
    base["hidden_offers"] = [
        str(x) for x in (raw.get("hidden_offers") or []) if str(x).strip()
    ]
    shippers = []
    for s in raw.get("hidden_shippers") or []:
        if not isinstance(s, dict):
            continue
        shippers.append(
            {
                "timocom_id": str(s.get("timocom_id") or "").strip(),
                "name": str(s.get("name") or "").strip(),
                "added_at": str(s.get("added_at") or "").strip(),
                "note": str(s.get("note") or "").strip(),
            }
        )
    base["hidden_shippers"] = shippers
    watched = []
    for w in raw.get("watched_shippers") or DEFAULT_WATCHED:
        if not isinstance(w, dict):
            continue
        label = str(w.get("label") or "").strip()
        match = str(w.get("match") or label).strip()
        if label and match:
            watched.append({"label": label, "match": match})
    base["watched_shippers"] = watched or [dict(x) for x in DEFAULT_WATCHED]
    return base


def save_filters(data_dir: Path, data: dict[str, Any]) -> Path:
    path = filters_path(data_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": FILTERS_VERSION,
        "hidden_offers": sorted({str(x) for x in data.get("hidden_offers") or [] if str(x)}),
        "hidden_shippers": list(data.get("hidden_shippers") or []),
        "watched_shippers": list(data.get("watched_shippers") or DEFAULT_WATCHED),
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def shipper_matches_hidden(offer: dict[str, Any], shipper: dict[str, Any]) -> bool:
    oid = str(offer.get("anbieter_timocom_id") or "").strip()
    oname = _norm(str(offer.get("anbieter_name") or ""))
    sid = str(shipper.get("timocom_id") or "").strip()
    sname = _norm(str(shipper.get("name") or ""))
    if sid and oid and sid == oid:
        return True
    if sname and oname and (oname == sname or sname in oname or oname in sname):
        return True
    return False


def is_offer_hidden(offer: dict[str, Any], filters: dict[str, Any]) -> bool:
    oid = str(offer.get("offer_id") or "").strip()
    if oid and oid in {str(x) for x in filters.get("hidden_offers") or []}:
        return True
    for shipper in filters.get("hidden_shippers") or []:
        if shipper_matches_hidden(offer, shipper):
            return True
    return False


def visible_offers(
    offers: list[dict[str, Any]],
    filters: dict[str, Any],
    *,
    include_hidden: bool = False,
) -> list[dict[str, Any]]:
    if include_hidden:
        return list(offers)
    return [o for o in offers if not is_offer_hidden(o, filters)]


def offer_matches_watch(offer: dict[str, Any], watch: dict[str, Any]) -> bool:
    needle = _norm(str(watch.get("match") or ""))
    if not needle:
        return False
    name = _norm(str(offer.get("anbieter_name") or ""))
    return bool(name) and needle in name


def offers_for_watched(
    offers: list[dict[str, Any]],
    filters: dict[str, Any],
    *,
    watch_label: str | None = None,
) -> list[dict[str, Any]]:
    watched = filters.get("watched_shippers") or []
    if watch_label:
        watched = [w for w in watched if _norm(w.get("label", "")) == _norm(watch_label)]
    if not watched:
        return []
    out = []
    seen = set()
    for offer in offers:
        if is_offer_hidden(offer, filters):
            continue
        for w in watched:
            if offer_matches_watch(offer, w):
                oid = str(offer.get("offer_id") or "")
                if oid and oid not in seen:
                    seen.add(oid)
                    enriched = dict(offer)
                    enriched["_watch_label"] = w.get("label") or ""
                    out.append(enriched)
                break
    out.sort(key=lambda o: str(o.get("zuletzt_gesehen") or ""), reverse=True)
    return out


def hide_offer(data_dir: Path, offer_id: str) -> dict[str, Any]:
    filters = load_filters(data_dir)
    oid = str(offer_id or "").strip()
    if oid and oid not in filters["hidden_offers"]:
        filters["hidden_offers"].append(oid)
        save_filters(data_dir, filters)
    return filters


def unhide_offer(data_dir: Path, offer_id: str) -> dict[str, Any]:
    filters = load_filters(data_dir)
    oid = str(offer_id or "").strip()
    filters["hidden_offers"] = [x for x in filters["hidden_offers"] if x != oid]
    save_filters(data_dir, filters)
    return filters


def hide_shipper(
    data_dir: Path,
    *,
    timocom_id: str = "",
    name: str = "",
    note: str = "",
    tz_name: str = "Europe/Berlin",
) -> dict[str, Any]:
    filters = load_filters(data_dir)
    tid = str(timocom_id or "").strip()
    n = str(name or "").strip()
    if not tid and not n:
        return filters
    for existing in filters["hidden_shippers"]:
        if tid and existing.get("timocom_id") == tid:
            return filters
        if n and _norm(existing.get("name", "")) == _norm(n):
            return filters
    filters["hidden_shippers"].append(
        {
            "timocom_id": tid,
            "name": n,
            "added_at": datetime.now(ZoneInfo(tz_name)).strftime("%Y-%m-%d %H:%M:%S %Z"),
            "note": str(note or "").strip(),
        }
    )
    save_filters(data_dir, filters)
    return filters


def unhide_shipper(
    data_dir: Path,
    *,
    timocom_id: str = "",
    name: str = "",
) -> dict[str, Any]:
    filters = load_filters(data_dir)
    tid = str(timocom_id or "").strip()
    n = _norm(name)
    kept = []
    for s in filters["hidden_shippers"]:
        if tid and s.get("timocom_id") == tid:
            continue
        if n and _norm(s.get("name", "")) == n:
            continue
        kept.append(s)
    filters["hidden_shippers"] = kept
    save_filters(data_dir, filters)
    return filters


def add_watched_shipper(data_dir: Path, *, label: str, match: str = "") -> dict[str, Any]:
    filters = load_filters(data_dir)
    lab = str(label or "").strip()
    m = str(match or lab).strip()
    if not lab or not m:
        return filters
    for w in filters["watched_shippers"]:
        if _norm(w.get("label", "")) == _norm(lab):
            w["match"] = m
            save_filters(data_dir, filters)
            return filters
    filters["watched_shippers"].append({"label": lab, "match": m})
    save_filters(data_dir, filters)
    return filters


def remove_watched_shipper(data_dir: Path, *, label: str) -> dict[str, Any]:
    filters = load_filters(data_dir)
    lab = _norm(label)
    filters["watched_shippers"] = [
        w for w in filters["watched_shippers"] if _norm(w.get("label", "")) != lab
    ]
    if not filters["watched_shippers"]:
        filters["watched_shippers"] = [dict(x) for x in DEFAULT_WATCHED]
    save_filters(data_dir, filters)
    return filters
