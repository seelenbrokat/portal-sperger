"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PortalShell, usePortalEmail } from "../../components/PortalShell";
import { createLabelsPdf, createLoadingListPdf } from "../../lib/shipmentDocs";
import {
  formatWhen,
  getKunde,
  listSendungen,
  type Sendung,
} from "../../lib/storage";
import styles from "../erfassung.module.css";

export default function SendungenPage() {
  const email = usePortalEmail();
  const [items, setItems] = useState<Sendung[]>([]);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(listSendungen());
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) =>
      `${s.referenz} ${s.absender} ${s.empfaenger} ${s.abholort} ${s.zustellort} ${s.status}`
        .toLowerCase()
        .includes(q),
    );
  }, [items, filter]);

  async function makeLabels(s: Sendung) {
    setError("");
    setMessage("");
    setBusy(`label-${s.id}`);
    try {
      const doc = await createLabelsPdf(s, email || "portal");
      setMessage(`Etiketten erstellt: ${doc.fileName}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Etiketten fehlgeschlagen");
    } finally {
      setBusy("");
    }
  }

  async function makeLoadingList(s: Sendung) {
    setError("");
    setMessage("");
    setBusy(`lade-${s.id}`);
    try {
      const doc = await createLoadingListPdf(s, email || "portal");
      setMessage(`Ladeliste erstellt: ${doc.fileName}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ladeliste fehlgeschlagen");
    } finally {
      setBusy("");
    }
  }

  return (
    <PortalShell
      title="Sendungen"
      subtitle="Etiketten und Ladelisten wie im WOG-Portal – je Sendung erstellen"
    >
      <section className={styles.listCard}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div className="field" style={{ minWidth: 240, flex: 1 }}>
            <label htmlFor="filter">Suche</label>
            <input
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Referenz, Ort, Status…"
            />
          </div>
          <div className={styles.actions} style={{ alignItems: "flex-end" }}>
            <Link className="btn btn-primary" href="/sendungserfassung">
              Neue Sendung
            </Link>
          </div>
        </div>

        {message ? <p className={styles.ok}>{message}</p> : null}
        {error ? <p className={styles.err}>{error}</p> : null}

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            Noch keine Sendungen.{" "}
            <Link href="/sendungserfassung">Jetzt erfassen</Link>
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Referenz</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Erfasst</th>
                  <th>Dokumente erzeugen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const kunde = getKunde(s.kundeId);
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link href={`/sendungen/${s.id}`}>
                          <strong>{s.referenz}</strong>
                        </Link>
                        {kunde ? (
                          <div
                            style={{
                              color: "var(--sperger-muted)",
                              fontSize: "0.82rem",
                            }}
                          >
                            {kunde.name}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {s.abholort} → {s.zustellort}
                      </td>
                      <td>
                        <span className={styles.badge}>{s.status}</span>
                      </td>
                      <td>{formatWhen(s.createdAt)}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className="btn btn-primary"
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() => makeLabels(s)}
                          >
                            {busy === `label-${s.id}`
                              ? "Erstelle…"
                              : "Etiketten erstellen"}
                          </button>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() => makeLoadingList(s)}
                          >
                            {busy === `lade-${s.id}`
                              ? "Erstelle…"
                              : "Ladeliste erstellen"}
                          </button>
                          <Link
                            className="btn btn-secondary"
                            href={`/sendungen/${s.id}`}
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PortalShell>
  );
}
