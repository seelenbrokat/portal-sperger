"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Session = { email: string; at: number };

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("sperger.session");
      if (!raw) {
        router.replace("/");
        return;
      }
      setSession(JSON.parse(raw) as Session);
    } catch {
      router.replace("/");
    }
  }, [router]);

  function logout() {
    window.sessionStorage.removeItem("sperger.session");
    router.push("/");
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/sperger-logo-retina.png"
            alt="Spedition Sperger"
            width={400}
            height={152}
          />
        </Link>
        <nav className={styles.nav}>
          <a className="active" href="#uebersicht">
            Übersicht
          </a>
          <Link href="/track">Sendungen</Link>
          <a href="mailto:zoll@spedition-sperger.at">Zoll kontaktieren</a>
          <button type="button" onClick={logout}>
            Abmelden
          </button>
        </nav>
      </aside>

      <main className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1>Übersicht</h1>
            <p>Angemeldet als {session.email}</p>
          </div>
        </header>

        <section className={styles.grid} id="uebersicht">
          <article className={styles.tile}>
            <span>Offene Sendungen</span>
            <strong>12</strong>
          </article>
          <article className={styles.tile}>
            <span>In Zoll</span>
            <strong>3</strong>
          </article>
          <article className={styles.tile}>
            <span>Zustellung heute</span>
            <strong>5</strong>
          </article>
        </section>

        <section className={styles.panel}>
          <h2>Aktuelle Transporte</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Referenz</th>
                <th>Route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SPG26001</td>
                <td>Lustenau → St. Gallen</td>
                <td>In Zollabfertigung</td>
              </tr>
              <tr>
                <td>SPG26002</td>
                <td>Lustenau → Zürich</td>
                <td>Unterwegs</td>
              </tr>
              <tr>
                <td>SPG26003</td>
                <td>Altstätten → Lustenau</td>
                <td>Zugestellt</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
