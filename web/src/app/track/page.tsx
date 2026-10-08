"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import styles from "./page.module.css";

type TrackResult = {
  reference: string;
  origin: string;
  destination: string;
  status: string;
  eta: string;
};

const DEMO: Record<string, TrackResult> = {
  SPG26001: {
    reference: "SPG26001",
    origin: "Lustenau AT",
    destination: "St. Gallen CH",
    status: "In Zollabfertigung",
    eta: "heute, 16:30",
  },
  SPG26002: {
    reference: "SPG26002",
    origin: "Lustenau AT",
    destination: "Zürich CH",
    status: "Unterwegs",
    eta: "morgen, 10:00",
  },
};

export default function TrackPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [missing, setMissing] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const key = query.trim().toUpperCase();
    const hit = DEMO[key];
    setResult(hit || null);
    setMissing(!hit);
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={styles.topInner}>
          <Link href="/" className={styles.brand}>
            <Image
              src="/sperger-logo.png"
              alt="Spedition Sperger"
              width={200}
              height={76}
            />
            <span>Portal</span>
          </Link>
          <Link className="btn btn-ghost" href="/">
            Zur Anmeldung
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.panel}>
          <h1>Sendung verfolgen</h1>
          <p>
            Referenznummer Ihrer Sperger-Sendung eingeben (Demo: SPG26001 oder
            SPG26002).
          </p>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="ref">Referenz / Sendungsnummer</label>
              <input
                id="ref"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="z. B. SPG26001"
                required
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Status abrufen
            </button>
          </form>

          {result ? (
            <div className={styles.result}>
              <h2>{result.reference}</h2>
              <dl className={styles.grid}>
                <div>
                  <dt>Abholung</dt>
                  <dd>{result.origin}</dd>
                </div>
                <div>
                  <dt>Zustellung</dt>
                  <dd>{result.destination}</dd>
                </div>
                <div>
                  <dt>ETA</dt>
                  <dd>{result.eta}</dd>
                </div>
              </dl>
              <div className={styles.status}>{result.status}</div>
            </div>
          ) : null}

          {missing ? (
            <p role="status" style={{ marginTop: "1rem", color: "var(--warn)" }}>
              Keine Sendung mit dieser Referenz gefunden.
            </p>
          ) : null}
        </section>
      </main>

      <footer className="site-footer">
        Spedition Sperger GmbH · Steinackerstraße 7 · 6890 Lustenau
      </footer>
    </div>
  );
}
