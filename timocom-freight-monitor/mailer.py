"""SMTP-Versand der täglichen Zusammenfassung."""

from __future__ import annotations

import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any


def build_summary_html(
    *,
    day: str,
    new_offers: list[dict[str, Any]],
    seen_offers: list[dict[str, Any]],
    origin_label: str,
    dest_label: str,
    excel_path: str,
) -> str:
    def row_html(o: dict[str, Any]) -> str:
        route = (
            f"{o.get('loading_country','')} {o.get('loading_postal_code','')} {o.get('loading_city','')}"
            f" → {o.get('unloading_country','')} {o.get('unloading_postal_code','')} {o.get('unloading_city','')}"
        )
        link = o.get("deeplink") or ""
        link_html = f'<a href="{link}">Timocom</a>' if link else ""
        anbieter = o.get("anbieter_name") or ""
        tid = o.get("anbieter_timocom_id") or ""
        return (
            "<tr>"
            f"<td>{route}</td>"
            f"<td>{o.get('loading_earliest_date','')}</td>"
            f"<td>{o.get('weight_t','')}</td>"
            f"<td>{o.get('length_m','')}</td>"
            f"<td>{o.get('vehicle_body','')}</td>"
            f"<td>{tid}</td>"
            f"<td>{anbieter}</td>"
            f"<td>{(o.get('freight_description') or '')[:80]}</td>"
            f"<td>{link_html}</td>"
            "</tr>"
        )

    new_rows = "".join(row_html(o) for o in new_offers) or (
        "<tr><td colspan='9'>Keine neuen Angebote heute.</td></tr>"
    )
    return f"""
<html><body style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222">
  <h2>Timocom-Frachtsuche – Tageszusammenfassung {day}</h2>
  <p><b>Suche:</b> {origin_label} → {dest_label}<br>
  <b>Neu heute:</b> {len(new_offers)} &nbsp;|&nbsp; <b>Gesamt gesehen heute:</b> {len(seen_offers)}</p>
  <p>Datei: <code>{excel_path}</code></p>
  <h3>Neue Angebote</h3>
  <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
    <thead style="background:#0069B4;color:#fff">
      <tr>
        <th>Route</th><th>Ladedatum</th><th>Gewicht (t)</th><th>Länge (m)</th>
        <th>Aufbau</th><th>Timocom-ID</th><th>Anbieter</th><th>Beschreibung</th><th>Link</th>
      </tr>
    </thead>
    <tbody>{new_rows}</tbody>
  </table>
  <p style="margin-top:24px;color:#666;font-size:12px">Automatisch erzeugt vom Timocom Freight Monitor.</p>
</body></html>
"""


def send_email(
    *,
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    use_tls: bool,
    mail_from: str,
    mail_to: str,
    subject: str,
    html_body: str,
) -> None:
    if not smtp_host or not mail_to:
        raise RuntimeError("SMTP_HOST und MAIL_TO müssen gesetzt sein.")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = mail_from or smtp_user
    msg["To"] = mail_to
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    if use_tls:
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port, timeout=60) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            if smtp_user:
                server.login(smtp_user, smtp_password)
            server.sendmail(msg["From"], [a.strip() for a in mail_to.split(",")], msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=60) as server:
            if smtp_user:
                server.login(smtp_user, smtp_password)
            server.sendmail(msg["From"], [a.strip() for a in mail_to.split(",")], msg.as_string())
