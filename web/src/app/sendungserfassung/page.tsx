"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PortalShell, usePortalEmail } from "../../components/PortalShell";
import {
  formatAddress,
  listAdressen,
  listKunden,
  listSendungen,
  saveSendung,
  type Adresse,
  type Kunde,
  type Sendung,
  formatWhen,
} from "../../lib/storage";
import styles from "../erfassung.module.css";

const empty = {
  referenz: "",
  kundeId: "",
  absender: "",
  empfaenger: "",
  abholort: "",
  zustellort: "",
  abholAdresseId: "",
  zustellAdresseId: "",
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
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [adressen, setAdressen] = useState<Adresse[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(listSendungen());
    const k = listKunden().filter((x) => x.active && x.kind === "CUSTOMER");
    setKunden(k);
    setForm((prev) => (prev.kundeId ? prev : { ...prev, kundeId: k[0]?.id || "" }));
  }, []);

  useEffect(() => {
    if (!form.kundeId) {
      setAdressen([]);
      return;
    }
    setAdressen(listAdressen(form.kundeId));
  }, [form.kundeId]);

  const pickupOptions = useMemo(
    () => adressen.filter((a) => a.usage !== "DELIVERY"),
    [adressen],
  );
  const deliveryOptions = useMemo(
    () => adressen.filter((a) => a.usage !== "PICKUP"),
    [adressen],
  );

  function onChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function applyAbholung(id: string) {
    const a = adressen.find((x) => x.id === id);
    if (!a) return;
    setForm((prev) => ({
      ...prev,
      abholAdresseId: id,
      absender: a.company || a.label,
      abholort: formatAddress(a),
    }));
  }

  function applyZustellung(id: string) {
    const a = adressen.find((x) => x.id === id);
    if (!a) return;
    setForm((prev) => ({
      ...prev,
      zustellAdresseId: id,
      empfaenger: a.company || a.label,
      zustellort: formatAddress(a),
    }));
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
    setForm({ ...empty, kundeId: form.kundeId });
    setMessage(`Sendung ${saved.referenz} erfasst (${saved.id}).`);
  }

  return (
    <PortalShell
      title="Sendungserfassung"
      subtitle="Neue Transporte – Adressen aus dem Kunden-Adressbuch wählbar"
    >
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <h2>Neue Sendung</h2>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.grid2}>
              <div className="field">
                <label htmlFor="kundeId">Kunde</label>
                <select
                  id="kundeId"
                  name="kundeId"
                  value={form.kundeId}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      kundeId: e.target.value,
                      abholAdresseId: "",
                      zustellAdresseId: "",
                    }));
                  }}
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
            </div>

            <div className={styles.grid2}>
              <div className="field">
                <label htmlFor="abholAdresseId">Abholadresse aus Adressbuch</label>
                <select
                  id="abholAdresseId"
                  value={form.abholAdresseId}
                  onChange={(e) => applyAbholung(e.target.value)}
                >
                  <option value="">— manuell eingeben —</option>
                  {pickupOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label || a.company} · {a.zip} {a.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="zustellAdresseId">
                  Zustelladresse aus Adressbuch
                </label>
                <select
                  id="zustellAdresseId"
                  value={form.zustellAdresseId}
                  onChange={(e) => applyZustellung(e.target.value)}
                >
                  <option value="">— manuell eingeben —</option>
                  {deliveryOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label || a.company} · {a.zip} {a.city}
                    </option>
                  ))}
                </select>
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

            <div className={styles.grid2}>
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
                  setForm({ ...empty, kundeId: form.kundeId });
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
                        <div
                          style={{
                            color: "var(--sperger-muted)",
                            fontSize: "0.82rem",
                          }}
                        >
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
