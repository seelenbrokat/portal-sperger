"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell, usePortalEmail } from "../../components/PortalShell";
import {
  formatWhen,
  listSendungen,
  saveSendung,
  type Sendung,
} from "../../lib/storage";
import styles from "../erfassung.module.css";

const empty = {
  referenz: "",
  absender: "",
  empfaenger: "",
  abholort: "",
  zustellort: "",
  colli: "",
  gewichtKg: "",
  lademeter: "",
  warenbeschreibung: "",
  ladetermin: "",
  status: "Erfasst",
};

export default function SendungserfassungPage() {
  const email = usePortalEmail();
  const [form, setForm] = useState(empty);
  const [items, setItems] = useState<Sendung[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(listSendungen());
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

    if (!form.referenz.trim() || !form.abholort.trim() || !form.zustellort.trim()) {
      setError("Referenz, Abholort und Zustellort sind Pflichtfelder.");
      return;
    }

    const saved = saveSendung({
      ...form,
      referenz: form.referenz.trim().toUpperCase(),
      createdBy: email || "unbekannt",
    });
    setItems(listSendungen());
    setForm(empty);
    setMessage(`Sendung ${saved.referenz} erfasst (${saved.id}).`);
  }

  return (
    <PortalShell
      title="Sendungserfassung"
      subtitle="Neue Transporte für Spedition Sperger erfassen"
    >
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <h2>Neue Sendung</h2>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.grid2}>
              <div className="field">
                <label htmlFor="referenz">Referenz *</label>
                <input
                  id="referenz"
                  name="referenz"
                  value={form.referenz}
                  onChange={onChange}
                  placeholder="z. B. SPG26010"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="ladetermin">Ladetermin</label>
                <input
                  id="ladetermin"
                  name="ladetermin"
                  type="datetime-local"
                  value={form.ladetermin}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className="field">
                <label htmlFor="absender">Absender</label>
                <input
                  id="absender"
                  name="absender"
                  value={form.absender}
                  onChange={onChange}
                />
              </div>
              <div className="field">
                <label htmlFor="empfaenger">Empfänger</label>
                <input
                  id="empfaenger"
                  name="empfaenger"
                  value={form.empfaenger}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className="field">
                <label htmlFor="abholort">Abholort *</label>
                <input
                  id="abholort"
                  name="abholort"
                  value={form.abholort}
                  onChange={onChange}
                  placeholder="z. B. Lustenau AT"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="zustellort">Zustellort *</label>
                <input
                  id="zustellort"
                  name="zustellort"
                  value={form.zustellort}
                  onChange={onChange}
                  placeholder="z. B. St. Gallen CH"
                  required
                />
              </div>
            </div>

            <div className={styles.grid3}>
              <div className="field">
                <label htmlFor="colli">Colli</label>
                <input
                  id="colli"
                  name="colli"
                  value={form.colli}
                  onChange={onChange}
                  inputMode="numeric"
                />
              </div>
              <div className="field">
                <label htmlFor="gewichtKg">Gewicht (kg)</label>
                <input
                  id="gewichtKg"
                  name="gewichtKg"
                  value={form.gewichtKg}
                  onChange={onChange}
                  inputMode="decimal"
                />
              </div>
              <div className="field">
                <label htmlFor="lademeter">Lademeter</label>
                <input
                  id="lademeter"
                  name="lademeter"
                  value={form.lademeter}
                  onChange={onChange}
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="warenbeschreibung">Warenbeschreibung</label>
              <textarea
                id="warenbeschreibung"
                name="warenbeschreibung"
                value={form.warenbeschreibung}
                onChange={onChange}
                rows={3}
              />
            </div>

            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={onChange}
              >
                <option>Erfasst</option>
                <option>Bereit zur Abholung</option>
                <option>Unterwegs</option>
                <option>In Zollabfertigung</option>
                <option>Zugestellt</option>
              </select>
            </div>

            {error ? <p className={styles.err}>{error}</p> : null}
            {message ? <p className={styles.ok}>{message}</p> : null}

            <div className={styles.actions}>
              <button className="btn btn-primary" type="submit">
                Sendung speichern
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
          <h2>Erfasste Sendungen ({items.length})</h2>
          {items.length === 0 ? (
            <p className={styles.empty}>Noch keine Sendungen erfasst.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Referenz</th>
                    <th>Route</th>
                    <th>Colli / kg / m</th>
                    <th>Status</th>
                    <th>Erfasst</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.referenz}</strong>
                        <div style={{ color: "var(--sperger-muted)", fontSize: "0.82rem" }}>
                          {item.id}
                        </div>
                      </td>
                      <td>
                        {item.abholort} → {item.zustellort}
                      </td>
                      <td>
                        {item.colli || "—"} / {item.gewichtKg || "—"} /{" "}
                        {item.lademeter || "—"}
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
