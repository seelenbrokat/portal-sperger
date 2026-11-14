"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "../../components/PortalShell";
import { listPartner, savePartner, type Partner } from "../../lib/storage";
import styles from "../erfassung.module.css";

const empty = {
  code: "",
  name: "",
  contact: "",
  email: "",
  phone: "",
  notes: "",
  active: true,
};

export default function PartnerPage() {
  const [items, setItems] = useState<Partner[]>([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems(listPartner());
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) return;
    savePartner({
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
    });
    setForm(empty);
    setMessage("Partner gespeichert.");
    setItems(listPartner());
  }

  return (
    <PortalShell
      title="Partner"
      subtitle="Subunternehmer und Schnittstellenpartner"
    >
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <h2>Partner anlegen</h2>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.grid2}>
              <div className="field">
                <label>Code *</label>
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
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
            </div>
            <div className={styles.grid3}>
              <div className="field">
                <label>Ansprechpartner</label>
                <input
                  value={form.contact}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>E-Mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Telefon</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Notiz</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
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
          <h2>Partner ({items.length})</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Kontakt</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>{p.code}</td>
                    <td>
                      {p.name}
                      {p.notes ? (
                        <div
                          style={{
                            color: "var(--sperger-muted)",
                            fontSize: "0.82rem",
                          }}
                        >
                          {p.notes}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {p.contact || "—"}
                      <div
                        style={{
                          color: "var(--sperger-muted)",
                          fontSize: "0.82rem",
                        }}
                      >
                        {[p.email, p.phone].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td>
                      <span className={styles.badge}>
                        {p.active ? "Aktiv" : "Inaktiv"}
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
