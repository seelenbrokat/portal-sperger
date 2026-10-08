import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "../components/LoginForm";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <main className={styles.hero}>
        <div className={styles.heroMedia} aria-hidden="true">
          <Image
            src="/sperger-hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroShade} />
          <div className={styles.heroSweep} />
        </div>

        <div className={styles.heroInner}>
          <section className={styles.brandBlock}>
            <div className={styles.logoPlate}>
              <Image
                src="/sperger-logo-retina.png"
                alt="Spedition Sperger"
                width={400}
                height={152}
                priority
              />
            </div>
            <h1 className={styles.headline}>Portal für Zoll & Transport</h1>
            <p className={styles.sub}>
              Sendungen verfolgen, Dokumente austauschen und den Status Ihrer
              Transporte bei Spedition Sperger einsehen.
            </p>
            <div className={styles.ctaRow}>
              <Link className="btn btn-ghost" href="/track">
                Sendung verfolgen
              </Link>
            </div>
          </section>

          <aside className={styles.authPanel}>
            <h2>Anmelden</h2>
            <p>Zugang für Kunden, Disposition und Partner</p>
            <LoginForm />
            <div className={styles.authLinks}>
              <Link href="mailto:zoll@spedition-sperger.at">Zugang anfragen</Link>
              <Link href="/track">Ohne Login verfolgen</Link>
            </div>
          </aside>
        </div>
      </main>

      <div className={styles.metaStrip}>
        <span>
          <strong>AEO</strong> zertifiziert
        </span>
        <span>
          <strong>Lustenau</strong> · Steinackerstraße 7
        </span>
        <span>
          <strong>+43 5577 82374</strong>
        </span>
      </div>

      <footer className="site-footer">
        © {new Date().getFullYear()} Spedition Sperger GmbH ·{" "}
        <a href="https://spedition-sperger.at/" target="_blank" rel="noreferrer">
          spedition-sperger.at
        </a>
        {" · "}
        Hosted on sperger.logistikberater.at
      </footer>
    </>
  );
}
