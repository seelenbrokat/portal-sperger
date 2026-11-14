"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "../../components/PortalShell";
import {
  formatWhen,
  listSendungen,
  listZollvorgaenge,
  type Sendung,
  type Zollvorgang,
} from "../../lib/storage";
import styles from "./page.module.css";

export default function DashboardPage() {
  const [sendungen, setSendungen] = useState<Sendung[]>([]);
  const [zoll, setZoll] = useState<Zollvorgang[]>([]);

  useEffect(() => {
    setSendungen(listSendungen());
    setZoll(listZollvorgaenge());
  }, []);

  const openSendungen = sendungen.filter(
    (s) => s.status !== "Zugestellt",
  ).length;
  const inZoll =
    zoll.filter((z) => z.status !== "Abgeschlossen").length +
    sendungen.filter((s) => s.status === "In Zollabfertigung").length;

  return (
    <PortalShell title="Übersicht">
      <section className={styles.grid} id="uebersicht">
        <Link href="/sendungserfassung" className={styles.tile}>
          <span>Offene Sendungen</span>
          <strong>{openSendungen}</strong>
        </Link>
        <Link href="/zollerfassung" className={styles.tile}>
          <span>Offene Zollvorgänge</span>
          <strong>{inZoll}</strong>
        </Link>
        <article className={styles.tile}>
          <span>Erfasst gesamt</span>
          <strong>{sendungen.length + zoll.length}</strong>
        </article>
      </section>

      <section className={styles.actions}>
        <Link className="btn btn-primary" href="/sendungen">
          Sendungen / Etiketten / Ladeliste
        </Link>
        <Link className="btn btn-secondary" href="/sendungserfassung">
          Neuer Auftrag
        </Link>
        <Link className="btn btn-secondary" href="/zollerfassung">
          Zoll erfassen
        </Link>
        <Link className="btn btn-secondary" href="/kunden">
          Kunden
        </Link>
        <Link className="btn btn-secondary" href="/adressbuch">
          Adressbuch
        </Link>
        <Link className="btn btn-secondary" href="/dokumente">
          Dokumente
        </Link>
        <Link className="btn btn-secondary" href="/track">
          Sendung verfolgen
        </Link>
      </section>

      <section className={styles.panel}>
        <h2>Letzte Sendungen</h2>
        {sendungen.length === 0 ? (
          <p className={styles.empty}>
            Noch keine Sendungen.{" "}
            <Link href="/sendungserfassung">Jetzt erfassen</Link>
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Referenz</th>
                <th>Route</th>
                <th>Status</th>
                <th>Erfasst</th>
              </tr>
            </thead>
            <tbody>
              {sendungen.slice(0, 8).map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/sendungen/${s.id}`}>{s.referenz}</Link>
                  </td>
                  <td>
                    {s.abholort} → {s.zustellort}
                  </td>
                  <td>{s.status}</td>
                  <td>{formatWhen(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel}>
        <h2>Letzte Zollvorgänge</h2>
        {zoll.length === 0 ? (
          <p className={styles.empty}>
            Noch keine Zollvorgänge.{" "}
            <Link href="/zollerfassung">Jetzt erfassen</Link>
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Referenz</th>
                <th>Richtung</th>
                <th>Status</th>
                <th>Erfasst</th>
              </tr>
            </thead>
            <tbody>
              {zoll.slice(0, 8).map((z) => (
                <tr key={z.id}>
                  <td>{z.sendungsreferenz}</td>
                  <td>{z.richtung === "AT_CH" ? "AT → CH" : "CH → AT"}</td>
                  <td>{z.status}</td>
                  <td>{formatWhen(z.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </PortalShell>
  );
}
