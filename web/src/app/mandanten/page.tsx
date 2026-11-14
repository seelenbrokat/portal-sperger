"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "../../components/PortalShell";
import {
  listMandanten,
  saveMandant,
  type Mandant,
} from "../../lib/storage";
import styles from "../erfassung.module.css";

const empty = { code: "", name: "", legalName: "", active: true };

export default function MandantenPage() {
  const [items, setItems] = useState<Mandant[]>([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems(listMandanten());
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) return;
    saveMandant({
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      legalName: form.legalName.trim(),
    });
    setForm(empty);
    setMessage("Mandant gespeichert.");
    setItems(listMandanten());
  }

  return (
    <PortalShell
      title="Mandanten"
      subtitle="Organisationseinheiten von Spedition Sperger"
    >
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <h2>Mandant anlegen</h2>
          <p style={{ margin: "0 0 0.75rem", color: "var(--sperger-muted)" }}>
            Getrennte Sichtbarkeit für z. B. Spedition und Zollagentur – analog
            zum WOG-Mandantenmodell, aber nur für Sperger.
          </p>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.grid3}>
              <div className="field">
                <label>Code *</label>
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="z. B. SPG"
                />
              </div>
              <div className="field">
                <label>Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Rechtlicher Name</label>
                <input
                  value={form.legalName}
                  onChange={(e) =>
                    setForm({ ...form, legalName: e.target.value })
                  }
                />
              </div>
            </div>
            {message ? <p className={styles.ok}>{message}</p> : null}
            <div className={styles.actions}>
              <button className="btn btn-primary" type="submit">
                Speichern
              </button>
            </div>
          </form>
        </section>

        <section className={styles.listCard}>
          <h2>Mandanten ({items.length})</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Rechtlicher Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td>{m.code}</td>
                    <td>{m.name}</td>
                    <td>{m.legalName || "—"}</td>
                    <td>
                      <span className={styles.badge}>
                        {m.active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
