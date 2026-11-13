"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "../../components/PortalShell";
import {
  DOC_TYPE_LABELS,
  formatWhen,
  listDokumente,
  type DocType,
  type Dokument,
} from "../../lib/storage";
import styles from "../erfassung.module.css";

export default function DokumentePage() {
  const [items, setItems] = useState<Dokument[]>([]);
  const [filter, setFilter] = useState("");
  const [type, setType] = useState<"" | DocType>("");

  useEffect(() => {
    setItems(listDokumente());
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return items.filter((d) => {
      if (type && d.type !== type) return false;
      if (!q) return true;
      return `${d.referenz} ${d.fileName} ${d.note} ${DOC_TYPE_LABELS[d.type]}`
        .toLowerCase()
        .includes(q);
    });
  }, [items, filter, type]);

  return (
    <PortalShell
      title="Dokumente"
      subtitle="Etiketten, Ladelisten, CMR, Rechnungen und Zollpapiere"
    >
      <section className={styles.listCard}>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <div className="field" style={{ minWidth: 220, flex: 1 }}>
            <label htmlFor="filter">Suche</label>
            <input
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Referenz, Dateiname…"
            />
          </div>
          <div className="field" style={{ minWidth: 180 }}>
            <label htmlFor="type">Typ</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as "" | DocType)}
            >
              <option value="">Alle</option>
              {(Object.keys(DOC_TYPE_LABELS) as DocType[]).map((t) => (
                <option key={t} value={t}>
                  {DOC_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            Keine Dokumente. Dokumente entstehen beim Drucken von Etiketten /
            Ladelisten oder per Upload in der Sendungsdetailansicht.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Referenz</th>
                  <th>Typ</th>
                  <th>Datei</th>
                  <th>Erfasst</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link href={`/sendungen/${d.sendungId}`}>{d.referenz}</Link>
                    </td>
                    <td>
                      <span className={styles.badge}>
                        {DOC_TYPE_LABELS[d.type]}
                      </span>
                    </td>
                    <td>
                      {d.fileName}
                      {d.note ? (
                        <div
                          style={{
                            color: "var(--sperger-muted)",
                            fontSize: "0.82rem",
                          }}
                        >
                          {d.note}
                        </div>
                      ) : null}
                    </td>
                    <td>{formatWhen(d.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          className="btn btn-secondary"
                          href={`/sendungen/${d.sendungId}`}
                        >
                          Sendung
                        </Link>
                        {d.type === "LABEL" ? (
                          <Link
                            className="btn btn-secondary"
                            href={`/sendungen/${d.sendungId}/etiketten`}
                            target="_blank"
                          >
                            Etiketten
                          </Link>
                        ) : null}
                        {d.type === "LOADING_LIST" ? (
                          <Link
                            className="btn btn-secondary"
                            href={`/sendungen/${d.sendungId}/ladeliste`}
                            target="_blank"
                          >
                            Ladeliste
                          </Link>
                        ) : null}
                        {d.dataUrl ? (
                          <a
                            className="btn btn-secondary"
                            href={d.dataUrl}
                            download={d.fileName}
                          >
                            Download
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PortalShell>
  );
}
