import Image from "next/image";
import Link from "next/link";
import styles from "./vorschau.module.css";

export default function VorschauPage() {
  return (
    <div className={styles.page}>
      <div className={styles.previewBanner}>
        <span>
          <strong>Design-Vorschau</strong> – moderne Neufassung von
          spedition-sperger.at (nicht die Live-Site)
        </span>
        <a href="https://spedition-sperger.at/" target="_blank" rel="noreferrer">
          Aktuelle Website öffnen
        </a>
      </div>

      <header className={styles.hero}>
        <div className={styles.heroMedia} aria-hidden="true">
          <Image
            src="/vorschau/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroShade} />
          <div className={styles.heroBeam} />
        </div>

        <nav className={styles.nav} aria-label="Hauptnavigation">
          <a className={styles.navBrand} href="#top">
            Sperger
          </a>
          <div className={styles.navLinks}>
            <a href="#leistungen">Leistungen</a>
            <a href="#ueber-uns">Über uns</a>
            <a href="#kontakt">Kontakt</a>
            <a href="https://sperger.logistikberater.at/">Portal</a>
          </div>
        </nav>

        <div className={styles.heroContent} id="top">
          <div className={styles.brandMark}>
            <Image
              src="/vorschau/logo.png"
              alt="Spedition Sperger"
              width={400}
              height={152}
              priority
            />
          </div>
          <h1 className={styles.heroTitle}>Ihr Schweiz-Spezialist</h1>
          <p className={styles.heroLead}>
            Transport, Zoll und Lagerlogistik aus Lustenau – präzise über die
            Grenze, seit 1937.
          </p>
          <div className={styles.ctaRow}>
            <a className={`${styles.btn} ${styles.btnPrimary}`} href="#kontakt">
              Kontakt aufnehmen
            </a>
            <a className={`${styles.btn} ${styles.btnGhost}`} href="#leistungen">
              Leistungen ansehen
            </a>
          </div>
        </div>
      </header>

      <section className={styles.section} id="leistungen">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Leistungen</p>
          <h2>Drei Stärken. Ein Korridor.</h2>
          <p>
            Als international tätige Spedition und Zollagentur verbinden wir
            Österreich und die Schweiz – mit klaren Abläufen und kurzen Wegen.
          </p>
        </div>

        <div className={styles.services}>
          <article className={styles.service}>
            <div className={styles.serviceImg}>
              <Image
                src="/vorschau/leistungen-01.jpeg"
                alt="Zollabfertigung bei Spedition Sperger"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>
            <div className={styles.serviceBody}>
              <h3>Zollagentur</h3>
              <p>
                Erstellung der erforderlichen Papiere für den Export in die
                Schweiz – und von der Schweiz nach Österreich.
              </p>
            </div>
          </article>

          <article className={styles.service}>
            <div className={styles.serviceImg}>
              <Image
                src="/vorschau/leistungen-02.jpg"
                alt="Fuhrpark der Spedition Sperger"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>
            <div className={styles.serviceBody}>
              <h3>Spedition</h3>
              <p>
                Güterverkehr in der EU mit Schwerpunkt Schweiz – zuverlässig,
                termingenau und nah an Disposition und Empfänger.
              </p>
            </div>
          </article>

          <article className={styles.service}>
            <div className={styles.serviceImg}>
              <Image
                src="/vorschau/leistungen-03.jpeg"
                alt="Lagerlogistik bei Spedition Sperger"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>
            <div className={styles.serviceBody}>
              <h3>Lagerlogistik</h3>
              <p>
                Kommissionierung und Versand am Standort Lustenau – inkl.
                Außenlager für flexible Kapazitäten.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.band} aria-labelledby="aeo-title">
        <div className={styles.bandMedia}>
          <Image
            src="/vorschau/leistungen-titel.jpeg"
            alt="Betriebshof Spedition Sperger"
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
          />
        </div>
        <div className={styles.bandText}>
          <p className={styles.kicker} style={{ color: "rgba(255,255,255,0.75)" }}>
            Sicherheit & Vereinfachung
          </p>
          <h2 id="aeo-title">AEO-zertifiziert</h2>
          <p>
            Als Authorised Economic Operator profitieren Sie von zollamtlichen
            Vereinfachungen und unserem Platz im EU-Sicherheitskonzept – ohne
            unnötige Gesamtsicherheiten.
          </p>
          <a className={`${styles.btn} ${styles.btnPrimary}`} href="#kontakt">
            Zollanfrage stellen
          </a>
        </div>
      </section>

      <section className={styles.section} id="ueber-uns">
        <div className={styles.aboutGrid}>
          <div>
            <div className={styles.sectionHead}>
              <p className={styles.kicker}>Über uns</p>
              <h2>Drei Generationen Grenzkompetenz</h2>
              <p>
                Gegründet 1937 durch Johann Sperger – heute geführt von Heinz
                und Guntram Sperger in Lustenau.
              </p>
            </div>
            <ul className={styles.timeline}>
              <li>
                <strong>1937</strong>
                <span>Gründung durch Johann Sperger</span>
              </li>
              <li>
                <strong>1959</strong>
                <span>Übernahme durch Anton und Heinz Sperger</span>
              </li>
              <li>
                <strong>Heute</strong>
                <span>3. Generation: Heinz &amp; Guntram Sperger</span>
              </li>
            </ul>
            <div className={styles.facts}>
              <div className={styles.fact}>
                <b>17</b>
                <span>Mitarbeiter</span>
              </div>
              <div className={styles.fact}>
                <b>10</b>
                <span>LKW</span>
              </div>
              <div className={styles.fact}>
                <b>3</b>
                <span>Kleintransporter</span>
              </div>
            </div>
          </div>
          <div className={styles.aboutPhoto}>
            <Image
              src="/vorschau/team.jpg"
              alt="Team Spedition Sperger"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
            />
          </div>
        </div>
      </section>

      <section className={styles.section} id="kontakt">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Kontakt</p>
          <h2>Direkt in Lustenau erreichbar</h2>
          <p>Internationale Spedition, Transporte und Zollagentur.</p>
        </div>
        <div className={styles.contact}>
          <div className={styles.contactBlock}>
            <p>
              <strong>Spedition Sperger GmbH</strong>
            </p>
            <p>Steinackerstraße 7</p>
            <p>A-6890 Lustenau</p>
            <p>
              T{" "}
              <a href="tel:+43557782374">+43 5577 82374</a>
            </p>
            <p>
              F +43 5577 82374-6
            </p>
            <p>
              <a href="mailto:zoll@spedition-sperger.at">
                zoll@spedition-sperger.at
              </a>
            </p>
          </div>
          <div className={styles.hours}>
            <p>
              <strong>Öffnungszeiten</strong>
            </p>
            <table>
              <tbody>
                <tr>
                  <th>Mo – Do</th>
                  <td>07:30 – 12:00 · 13:00 – 17:00</td>
                </tr>
                <tr>
                  <th>Fr</th>
                  <td>07:30 – 12:00 · 13:00 – 16:30</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© {new Date().getFullYear()} Spedition Sperger GmbH</span>
          <span>
            <Link href="/">Zum Portal</Link>
            {" · "}
            <a
              href="https://spedition-sperger.at/kontakt/impressum/"
              target="_blank"
              rel="noreferrer"
            >
              Impressum
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
