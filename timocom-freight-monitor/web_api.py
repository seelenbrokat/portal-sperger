"""Kleine Flask-API für Ausblenden / Watchlist (nur localhost, Nginx proxied)."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Callable
from urllib.parse import quote

from flask import Flask, redirect, request

from filters import (
    add_watched_shipper,
    hide_offer,
    hide_shipper,
    remove_watched_shipper,
    unhide_offer,
    unhide_shipper,
)

LOG = logging.getLogger("timocom-freight-monitor.api")


def create_app(
    *,
    data_dir: Path,
    tz_name: str = "Europe/Berlin",
    on_change: Callable[[], None] | None = None,
) -> Flask:
    app = Flask(__name__)
    app.config["DATA_DIR"] = Path(data_dir)
    app.config["TZ_NAME"] = tz_name
    app.config["ON_CHANGE"] = on_change

    def _refresh() -> None:
        cb = app.config.get("ON_CHANGE")
        if cb:
            try:
                cb()
            except Exception:
                LOG.exception("HTML-Refresh nach Filteränderung fehlgeschlagen")

    def _back() -> str:
        ref = request.form.get("return_to") or request.headers.get("Referer") or "/filters.html"
        if not ref.startswith("/") and "://" not in ref:
            ref = "/" + ref
        if ref.startswith("http"):
            # nur Pfad+Query behalten
            from urllib.parse import urlparse

            parsed = urlparse(ref)
            ref = parsed.path or "/filters.html"
            if parsed.query:
                ref += "?" + parsed.query
        return ref

    def _redirect_ok(msg: str) -> Any:
        target = _back()
        sep = "&" if "?" in target else "?"
        return redirect(f"{target}{sep}msg={quote(msg)}")

    @app.get("/api/health")
    def health() -> Any:
        return {"ok": True}

    @app.post("/api/hide-offer")
    def api_hide_offer() -> Any:
        oid = (request.form.get("offer_id") or "").strip()
        if not oid:
            return _redirect_ok("Angebot-ID fehlt")
        hide_offer(app.config["DATA_DIR"], oid)
        _refresh()
        return _redirect_ok(f"Angebot {oid} ausgeblendet")

    @app.post("/api/unhide-offer")
    def api_unhide_offer() -> Any:
        oid = (request.form.get("offer_id") or "").strip()
        unhide_offer(app.config["DATA_DIR"], oid)
        _refresh()
        return _redirect_ok(f"Angebot {oid} wieder eingeblendet")

    @app.post("/api/hide-shipper")
    def api_hide_shipper() -> Any:
        hide_shipper(
            app.config["DATA_DIR"],
            timocom_id=(request.form.get("timocom_id") or "").strip(),
            name=(request.form.get("name") or "").strip(),
            note=(request.form.get("note") or "").strip(),
            tz_name=app.config["TZ_NAME"],
        )
        _refresh()
        name = (request.form.get("name") or request.form.get("timocom_id") or "Auftraggeber").strip()
        return _redirect_ok(f"Auftraggeber dauerhaft ausgeblendet: {name}")

    @app.post("/api/unhide-shipper")
    def api_unhide_shipper() -> Any:
        unhide_shipper(
            app.config["DATA_DIR"],
            timocom_id=(request.form.get("timocom_id") or "").strip(),
            name=(request.form.get("name") or "").strip(),
        )
        _refresh()
        return _redirect_ok("Auftraggeber wieder freigegeben")

    @app.post("/api/watch-add")
    def api_watch_add() -> Any:
        add_watched_shipper(
            app.config["DATA_DIR"],
            label=(request.form.get("label") or "").strip(),
            match=(request.form.get("match") or "").strip(),
        )
        _refresh()
        return _redirect_ok("Watchlist aktualisiert")

    @app.post("/api/watch-remove")
    def api_watch_remove() -> Any:
        remove_watched_shipper(
            app.config["DATA_DIR"],
            label=(request.form.get("label") or "").strip(),
        )
        _refresh()
        return _redirect_ok("Firma von Watchlist entfernt")

    return app


def run_api_server(
    *,
    data_dir: Path,
    tz_name: str,
    host: str,
    port: int,
    on_change: Callable[[], None] | None = None,
) -> None:
    app = create_app(data_dir=data_dir, tz_name=tz_name, on_change=on_change)
    LOG.info("Filter-API auf http://%s:%s", host, port)
    app.run(host=host, port=port, threaded=True, use_reloader=False)
