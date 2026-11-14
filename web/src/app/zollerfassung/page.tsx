"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell, usePortalEmail } from "../../components/PortalShell";
import {
  formatWhen,
  listKunden,
  listZollvorgaenge,
  saveZollvorgang,
  type Kunde,
  type Zollvorgang,
} from "../../lib/storage";
import styles from "../erfassung.module.css";

const empty = {
  sendungsreferenz: "",
  kundeId: "",
  richtung: "AT_CH" as const,
  verfahren: "Export CH",
  warenart: "",
  tarifnummer: "",
  warenwert: "",
  waehrung: "EUR",
  dokumente: "",
  bemerkung: "",
  status: "In Erfassung",
};

export default function ZollerfassungPage() {
  const email = usePortalEmail();
  const [form, setForm] = useState(empty);
  const [items, setItems] = useState<Zollvorgang[]>([]);
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(listZollvorgaenge());
    const k = listKunden().filter((x) => x.active);
    setKunden(k);
    if (k[0]) setForm((prev) => ({ ...prev, kundeId: k[0].id }));
  }, []);

  function onChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.sendungsreferenz.trim() || !form.warenart.trim()) {
      setError("Sendungsreferenz und Warenart sind Pflichtfelder.");
      return;
    }

    const saved = saveZollvorgang({
      ...form,
      sendungsreferenz: form.sendungsreferenz.trim().toUpperCase(),
      richtung: form.richtung as "AT_CH" | "CH_AT",
      createdBy: email || "unbekannt",
    });
    setItems(listZollvorgaenge());
    setForm({ ...empty, kundeId: form.kundeId });
    setMessage(
      `Zollvorgang für ${saved.sendungsreferenz} erfasst (${saved.id}).`,
    );
  }

  return (
    <PortalShell
      title="Zollerfassung"
      subtitle="Ausfuhr / Einfuhr AT ↔ CH für Spedition Sperger"
    >
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <h2>Neuer Zollvorgang</h2>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.grid2}>
              <div className="field">
                <label htmlFor="kundeId">Kunde</label>
                <select
                  id="kundeId"
                  name="kundeId"
                  value={form.kundeId}
                  onChange={onChange}
                >
                  {kunden.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                      {k.customerNumber ? ` (${k.customerNumber})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="sendungsreferenz">Sendungsreferenz *</label>
                <input
                  id="sendungsreferenz"
                  name="sendungsreferenz"
                  value={form.sendungsreferenz}
                  onChange={onChange}
                  placeholder="z. B. SPG26010"
                  required
                />
              </div>
            </div>

            <div className={styles.grid3}>
              <div className="field">
                <label htmlFor="richtung">Richtung *</label>
                <select
                  id="richtung"
                  name="richtung"
                  value={form.richtung}
                  onChange={onChange}
                >
                  <option value="AT_CH">AT → CH (Export)</option>
                  <option value="CH_AT">CH → AT (Import)</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="verfahren">Verfahren</label>
                <select
                  id="verfahren"
                  name="verfahren"
                  value={form.verfahren}
                  onChange={onChange}
                >
                  <option>Export CH</option>
                  <option>Import AT</option>
                  <option>T1 / NCTS</option>
                  <option>Zollager</option>
                  <option>Sonstiges</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={onChange}
                >
                  <option>In Erfassung</option>
                  <option>Dokumente geprüft</option>
                  <option>Angemeldet</option>
                  <option>Freigabe erteilt</option>
                  <option>Abgeschlossen</option>
                </select>
              </div>
            </div>

            <div className={styles.grid2}>
              <div className="field">
                <label htmlFor="warenart">Warenart *</label>
                <input
                  id="warenart"
                  name="warenart"
                  value={form.warenart}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="tarifnummer">Tarifnummer / HS-Code</label>
                <input
                  id="tarifnummer"
                  name="tarifnummer"
                  value={form.tarifnummer}
                  onChange={onChange}
                  placeholder="z. B. 8708 99"
                />
              </div>
            </div>

            <div className={styles.grid3}>
              <div className="field">
                <label htmlFor="warenwert">Warenwert</label>
                <input
                  id="warenwert"
                  name="warenwert"
                  value={form.warenwert}
                  onChange={onChange}
                  inputMode="decimal"
                />
              </div>
              <div className="field">
                <label htmlFor="waehrung">Währung</label>
                <select
                  id="waehrung"
                  name="waehrung"
                  value={form.waehrung}
                  onChange={onChange}
                >
                  <option>EUR</option>
                  <option>CHF</option>
                  <option>USD</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="dokumente">Dokumente</label>
                <input
                  id="dokumente"
                  name="dokumente"
                  value={form.dokumente}
                  onChange={onChange}
                  placeholder="Rechnung, CMR, MRN …"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="bemerkung">Bemerkung</label>
              <textarea
                id="bemerkung"
                name="bemerkung"
                value={form.bemerkung}
                onChange={onChange}
                rows={3}
              />
            </div>

            {error ? <p className={styles.err}>{error}</p> : null}
            {message ? <p className={styles.ok}>{message}</p> : null}

            <div className={styles.actions}>
              <button className="btn btn-primary" type="submit">
                Zollvorgang speichern
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setForm(empty);
                  setMessage("");
                  setError("");
                }}
              >
                Zurücksetzen
              </button>
            </div>
          </form>
        </section>

        <section className={styles.listCard}>
          <h2>Erfasste Zollvorgänge ({items.length})</h2>
          {items.length === 0 ? (
            <p className={styles.empty}>Noch keine Zollvorgänge erfasst.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Referenz</th>
                    <th>Richtung</th>
                    <th>Ware</th>
                    <th>Wert</th>
                    <th>Status</th>
                    <th>Erfasst</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.sendungsreferenz}</strong>
                        <div style={{ color: "var(--sperger-muted)", fontSize: "0.82rem" }}>
                          {item.id}
                        </div>
                      </td>
                      <td>
                        {item.richtung === "AT_CH" ? "AT → CH" : "CH → AT"}
                        <div style={{ color: "var(--sperger-muted)", fontSize: "0.82rem" }}>
                          {item.verfahren}
                        </div>
                      </td>
                      <td>
                        {item.warenart}
                        {item.tarifnummer ? (
                          <div style={{ color: "var(--sperger-muted)", fontSize: "0.82rem" }}>
                            {item.tarifnummer}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {item.warenwert
                          ? `${item.warenwert} ${item.waehrung}`
                          : "—"}
                      </td>
                      <td>
                        <span className={styles.badge}>{item.status}</span>
                      </td>
                      <td>{formatWhen(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
