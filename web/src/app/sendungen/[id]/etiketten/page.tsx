"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Barcode } from "../../../../components/Barcode";
import {
  buildSscc,
  colloCount,
  getKunde,
  getSendung,
  recordPrintDocument,
  type Sendung,
} from "../../../../lib/storage";
import styles from "../../../print.module.css";

export default function EtikettenPage() {
  const params = useParams<{ id: string }>();
  const [sendung, setSendung] = useState<Sendung | null>(null);

  useEffect(() => {
    const s = getSendung(params.id);
    setSendung(s);
    if (s) {
      recordPrintDocument(s, "LABEL", "portal");
    }
  }, [params.id]);

  const labels = useMemo(() => {
    if (!sendung) return [];
    const total = colloCount(sendung);
    return Array.from({ length: total }, (_, i) => ({
      n: i + 1,
      total,
      sscc: buildSscc(sendung.id, i + 1),
    }));
  }, [sendung]);

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
        <strong>Etiketten · {sendung.referenz}</strong>
        <div className={styles.actions}>
          <button className="btn btn-primary" type="button" onClick={() => window.print()}>
            Drucken
          </button>
          <Link className="btn btn-ghost" href={`/sendungen/${sendung.id}`}>
            Zur Sendung
          </Link>
        </div>
      </div>

      <div className={`${styles.sheet} ${styles.labels}`}>
        {labels.map((l) => (
          <article key={l.sscc} className={styles.label}>
            <div className={styles.brand}>Spedition Sperger</div>
            <div className={styles.meta}>
              <div>
                <strong>{sendung.referenz}</strong>
              </div>
              {kunde ? <div>Kunde {kunde.name}</div> : null}
              {sendung.warenbeschreibung ? (
                <div>{sendung.warenbeschreibung}</div>
              ) : null}
            </div>

            <div className={styles.colloBox}>
              <span>
                Collo {l.n} / {l.total}
              </span>
              <span>
                {[sendung.gewichtKg ? `${sendung.gewichtKg} kg` : null, sendung.lademeter ? `${sendung.lademeter} m` : null]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </span>
            </div>

            <div>
              <p className={styles.blockTitle}>Absender / Abholung</p>
              <p className={styles.blockBody}>
                {sendung.absender || "—"}
                <br />
                {sendung.abholort}
              </p>
            </div>

            <div>
              <p className={styles.blockTitle}>Empfänger / Zustellung</p>
              <p className={styles.blockBody}>
                {sendung.empfaenger || "—"}
                <br />
                {sendung.zustellort}
              </p>
            </div>

            <div className={styles.barcodeWrap}>
              <Barcode value={l.sscc} height={54} />
              <div className={styles.sscc}>(00) {l.sscc}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
