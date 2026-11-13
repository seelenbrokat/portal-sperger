"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  formatWhen,
  getKunde,
  getSendung,
  recordPrintDocument,
  type Sendung,
} from "../../../../lib/storage";
import styles from "../../../print.module.css";

export default function LadelistePage() {
  const params = useParams<{ id: string }>();
  const [sendung, setSendung] = useState<Sendung | null>(null);

  useEffect(() => {
    const s = getSendung(params.id);
    setSendung(s);
    if (s) recordPrintDocument(s, "LOADING_LIST", "portal");
  }, [params.id]);

  if (!sendung) {
    return (
      <div className={styles.sheet}>
        <p>Sendung nicht gefunden.</p>
        <Link href="/sendungserfassung">Zurück</Link>
      </div>
    );
  }

  const kunde = getKunde(sendung.kundeId);

  return (
    <div>
      <div className={styles.toolbar}>
        <strong>Ladeliste · {sendung.referenz}</strong>
        <div className={styles.actions}>
          <button className="btn btn-primary" type="button" onClick={() => window.print()}>
            Drucken
          </button>
          <Link className="btn btn-ghost" href={`/sendungen/${sendung.id}`}>
            Zur Sendung
          </Link>
        </div>
      </div>

      <div className={styles.sheet}>
        <article className={styles.lade}>
          <header className={styles.ladeHeader}>
            <div>
              <h1>Auftragsbestätigung / Ladeliste</h1>
              <p>
                Spedition Sperger · bestätigt die Erfassung und dient als
                Ladeliste für die Abholung.
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong style={{ fontSize: "14pt" }}>{sendung.referenz}</strong>
              <p>Erfasst {formatWhen(sendung.createdAt)}</p>
              <p>Status: {sendung.status}</p>
            </div>
          </header>

          <div className={styles.grid}>
            <div className={styles.box}>
              <h2>Kunde / Auftraggeber</h2>
              <p>
                {kunde?.name || "—"}
                {kunde?.customerNumber ? (
                  <>
                    <br />
                    Nr. {kunde.customerNumber}
                  </>
                ) : null}
              </p>
            </div>
            <div className={styles.box}>
              <h2>Ladetermin</h2>
              <p>
                {sendung.ladetermin
                  ? formatWhen(new Date(sendung.ladetermin).toISOString())
                  : "nach Absprache"}
              </p>
            </div>
            <div className={styles.box}>
              <h2>Abholung</h2>
              <p>
                {sendung.absender || "—"}
                <br />
                {sendung.abholort}
              </p>
            </div>
            <div className={styles.box}>
              <h2>Zustellung</h2>
              <p>
                {sendung.empfaenger || "—"}
                <br />
                {sendung.zustellort}
              </p>
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Ware</th>
                <th>Colli</th>
                <th>Gewicht</th>
                <th>Lademeter</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>{sendung.warenbeschreibung || "—"}</td>
                <td>{sendung.colli || "—"}</td>
                <td>{sendung.gewichtKg ? `${sendung.gewichtKg} kg` : "—"}</td>
                <td>{sendung.lademeter || "—"}</td>
              </tr>
            </tbody>
          </table>

          <p className={styles.footer}>
            Dieses Dokument bestätigt die Übermittlung des Auftrags an Spedition
            Sperger und dient als Ladeliste für die Abholung. Bei Fragen:
            zoll@spedition-sperger.at · spedition-sperger.at
          </p>
        </article>
      </div>
    </div>
  );
}
