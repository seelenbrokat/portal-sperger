"""TIMOCOM Freight Exchange Search Client."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import requests


def location_area(
    *,
    country: str,
    city: str,
    postal_code: str,
    radius_km: int,
) -> dict[str, Any]:
    """Umkreis-Suche um eine Adresse."""
    return {
        "objectType": "areaSearch",
        "area": {
            "address": {
                "objectType": "address",
                "country": country,
                "city": city,
                "postalCode": postal_code,
            },
            "size_km": radius_km,
        },
    }


def location_postal(country: str, postal_prefixes: list[str] | None = None) -> dict[str, Any]:
    """PLZ-Präfixe; leere Liste = ganzes Land."""
    area: dict[str, Any] = {"country": country}
    if postal_prefixes is not None:
        area["postalCodes"] = list(postal_prefixes)
    return {
        "objectType": "postalCodeAreasArray",
        "postalCodeAreas": [area],
    }


def build_location(spec: dict[str, Any]) -> dict[str, Any]:
    mode = spec.get("mode", "area")
    if mode == "area":
        return location_area(
            country=spec["country"],
            city=spec["city"],
            postal_code=spec["postal_code"],
            radius_km=int(spec["radius_km"]),
        )
    if mode == "postal":
        return location_postal(spec["country"], spec.get("postal_prefixes"))
    raise ValueError(f"Unbekannter Location-Mode: {mode}")


class TimocomClient:
    def __init__(self, base_url: str, username: str, password: str, timeout: int = 60):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.auth = (username, password)
        self.session.headers.update(
            {
                "Content-Type": "application/json",
                "Accept": "application/json, application/problem+json",
            }
        )
        self.timeout = timeout

    def search_freight_offers(
        self,
        *,
        start_location: dict[str, Any],
        destination_location: dict[str, Any],
        max_results: int = 30,
        first_result: int = 0,
        length_min_m: float | None = None,
        length_max_m: float | None = None,
        # Legacy-Parameter (Umkreis → PLZ)
        origin_city: str | None = None,
        origin_country: str | None = None,
        origin_postal_code: str | None = None,
        origin_radius_km: int | None = None,
        dest_country: str | None = None,
        dest_postal_prefixes: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Sucht Frachten. Bevorzugt start/destination_location; Legacy-Args bleiben nutzbar."""
        if origin_city is not None:
            start_location = location_area(
                country=origin_country or "",
                city=origin_city,
                postal_code=origin_postal_code or "",
                radius_km=int(origin_radius_km or 30),
            )
            destination_location = location_postal(
                dest_country or "", dest_postal_prefixes or []
            )

        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        body: dict[str, Any] = {
            "inclusiveRightUpperBoundDateTime": now,
            "firstResult": first_result,
            "maxResults": min(max_results, 30),
            "startLocation": start_location,
            "destinationLocation": destination_location,
        }
        if length_min_m is not None or length_max_m is not None:
            length_range: dict[str, float] = {}
            if length_min_m is not None:
                length_range["inclusiveMinimum"] = float(length_min_m)
            if length_max_m is not None:
                length_range["inclusiveMaximum"] = float(length_max_m)
            body["lengthRange_m"] = length_range

        url = f"{self.base_url}/freight-offers/search"
        resp = self.session.post(url, json=body, timeout=self.timeout)
        if resp.status_code != 200:
            raise RuntimeError(
                f"TIMOCOM Suche fehlgeschlagen ({resp.status_code}): {resp.text[:800]}"
            )
        data = resp.json()
        payload = data.get("payload") or []
        if not isinstance(payload, list):
            return []
        enriched = self.enrich_offers(payload)
        if length_max_m is not None:
            capped = float(length_max_m)
            filtered = []
            for offer in enriched:
                length = offer.get("length_m")
                try:
                    if length is not None and float(length) > capped:
                        continue
                except (TypeError, ValueError):
                    pass
                filtered.append(offer)
            return filtered
        return enriched

    def lookup_freight_offers(self, ids: list[str]) -> list[dict[str, Any]]:
        """Holt Angebotsdetails inkl. Anbieter (customer.id / customer.name)."""
        if not ids:
            return []
        url = f"{self.base_url}/freight-offers"
        resp = self.session.get(
            url,
            params=[("ids", oid) for oid in ids[:30]],
            timeout=self.timeout,
        )
        if resp.status_code != 200:
            raise RuntimeError(
                f"TIMOCOM Lookup fehlgeschlagen ({resp.status_code}): {resp.text[:800]}"
            )
        data = resp.json()
        payload = data.get("payload") or []
        return payload if isinstance(payload, list) else []

    def enrich_offers(self, offers: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Ergänzt Suchtreffer um Anbieterdaten aus dem Lookup."""
        ids = [o.get("id") for o in offers if o.get("id")]
        if not ids:
            return offers
        detailed = self.lookup_freight_offers(ids)
        by_id = {o.get("id"): o for o in detailed if o.get("id")}
        merged: list[dict[str, Any]] = []
        for offer in offers:
            oid = offer.get("id")
            rich = by_id.get(oid)
            if rich:
                merged.append({**offer, **rich})
            else:
                merged.append(offer)
        return merged
