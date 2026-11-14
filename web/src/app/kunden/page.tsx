"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PortalShell } from "../../components/PortalShell";
import {
  addContact,
  listAdressen,
  listKunden,
  saveKunde,
  type Kunde,
} from "../../lib/storage";
import styles from "../erfassung.module.css";

const empty: {
  name: string;
  customerNumber: string;
  matchcode: string;
  kind: "CUSTOMER" | "PARTNER";
  notes: string;
  active: boolean;
} = {
  name: "",
  customerNumber: "",
  matchcode: "",
  kind: "CUSTOMER",
  notes: "",
  active: true,
};

const emptyContact = { name: "", email: "", phone: "", department: "" };

export default function KundenPage() {
  const [items, setItems] = useState<Kunde[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [contactFor, setContactFor] = useState<string | null>(null);
  const [contact, setContact] = useState(emptyContact);
  const [addressCounts, setAddressCounts] = useState<Record<string, number>>(
    {},
  );

  function reload() {
    const kunden = listKunden();
    setItems(kunden);
    const counts: Record<string, number> = {};
    for (const a of listAdressen()) {
      counts[a.kundeId] = (counts[a.kundeId] || 0) + 1;
    }
    setAddressCounts(counts);
  }

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((k) =>
      `${k.name} ${k.customerNumber} ${k.matchcode} ${k.notes}`
        .toLowerCase()
        .includes(q),
    );
  }, [items, filter]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    saveKunde({
      ...form,
      id: editId || undefined,
      name: form.name.trim(),
      customerNumber: form.customerNumber.trim(),
      matchcode: form.matchcode.trim().toUpperCase(),
    });
    setForm(empty);
    setEditId(null);
    setMessage(editId ? "Kunde aktualisiert." : "Kunde angelegt.");
    reload();
  }

  function onAddContact(e: FormEvent) {
    e.preventDefault();
    if (!contactFor || !contact.name.trim()) return;
    addContact(contactFor, contact);
    setContact(emptyContact);
    setContactFor(null);
    setMessage("Ansprechpartner hinzugefügt.");
    reload();
  }

  return (
    <PortalShell
      title="Kunden"
      subtitle="Kundenstammdaten für Spedition Sperger – analog WOG, eigenständig"
    >
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <h2>{editId ? "Kunde bearbeiten" : "Neuer Kunde"}</h2>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.grid2}>
              <div className="field">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="customerNumber">Kundennummer</label>
                <input
                  id="customerNumber"
                  value={form.customerNumber}
                  onChange={(e) =>
                    setForm({ ...form, customerNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <div className={styles.grid3}>
              <div className="field">
                <label htmlFor="matchcode">Matchcode</label>
                <input
                  id="matchcode"
                  value={form.matchcode}
                  onChange={(e) =>
                    setForm({ ...form, matchcode: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="kind">Art</label>
                <select
                  id="kind"
                  value={form.kind}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kind: e.target.value as "CUSTOMER" | "PARTNER",
                    })
                  }
                >
                  <option value="CUSTOMER">Kunde</option>
                  <option value="PARTNER">Partner</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="active">Status</label>
                <select
                  id="active"
                  value={form.active ? "1" : "0"}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.value === "1" })
                  }
                >
                  <option value="1">Aktiv</option>
                  <option value="0">Inaktiv</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="notes">Notiz</label>
              <textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {message ? <p className={styles.ok}>{message}</p> : null}
            <div className={styles.actions}>
              <button className="btn btn-primary" type="submit">
                {editId ? "Speichern" : "Kunde anlegen"}
              </button>
              {editId ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setForm(empty);
                  }}
                >
                  Abbrechen
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className={styles.listCard}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "0.85rem",
            }}
          >
            <h2 style={{ margin: 0 }}>Kunden ({filtered.length})</h2>
            <div className="field" style={{ minWidth: 220 }}>
              <label htmlFor="filter">Suche</label>
              <input
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Name, Nr., Matchcode…"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className={styles.empty}>Keine Kunden gefunden.</p>
          ) : (
            <div className={styles.tableWrap}>
              {filtered.map((k) => (
                <div
                  key={k.id}
                  style={{
                    borderBottom: "1px solid var(--sperger-line)",
                    padding: "0.9rem 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong>{k.name}</strong>
                      <div
                        style={{
                          color: "var(--sperger-muted)",
                          fontSize: "0.88rem",
                        }}
                      >
                        Nr. {k.customerNumber || "—"}
                        {k.matchcode ? ` · Matchcode ${k.matchcode}` : ""}
                        {k.kind === "PARTNER" ? " · Partner" : ""}
                        {!k.active ? " · Inaktiv" : ""}
                      </div>
                      {k.notes ? (
                        <div
                          style={{
                            color: "var(--sperger-muted)",
                            fontSize: "0.88rem",
                          }}
                        >
                          {k.notes}
                        </div>
                      ) : null}
                    </div>
                    <div className={styles.actions}>
                      <span className={styles.badge}>
                        {addressCounts[k.id] || 0} Adressen
                      </span>
                      <Link
                        className="btn btn-secondary"
                        href={`/adressbuch?kunde=${k.id}`}
                      >
                        Adressbuch
                      </Link>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          setEditId(k.id);
                          setForm({
                            name: k.name,
                            customerNumber: k.customerNumber,
                            matchcode: k.matchcode,
                            kind: k.kind,
                            notes: k.notes,
                            active: k.active,
                          });
                          setMessage("");
                        }}
                      >
                        Bearbeiten
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          setContactFor(k.id);
                          setContact(emptyContact);
                        }}
                      >
                        Kontakt +
                      </button>
                    </div>
                  </div>

                  {k.contacts.length > 0 ? (
                    <table className={styles.table} style={{ marginTop: "0.6rem" }}>
                      <thead>
                        <tr>
                          <th>Ansprechpartner</th>
                          <th>E-Mail</th>
                          <th>Telefon</th>
                          <th>Abteilung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {k.contacts.map((c) => (
                          <tr key={c.id}>
                            <td>{c.name}</td>
                            <td>{c.email || "—"}</td>
                            <td>{c.phone || "—"}</td>
                            <td>{c.department || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}

                  {contactFor === k.id ? (
                    <form
                      className={styles.form}
                      style={{ marginTop: "0.75rem" }}
                      onSubmit={onAddContact}
                    >
                      <div className={styles.grid2}>
                        <div className="field">
                          <label>Name</label>
                          <input
                            required
                            value={contact.name}
                            onChange={(e) =>
                              setContact({ ...contact, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="field">
                          <label>E-Mail</label>
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) =>
                              setContact({ ...contact, email: e.target.value })
                            }
                          />
                        </div>
                        <div className="field">
                          <label>Telefon</label>
                          <input
                            value={contact.phone}
                            onChange={(e) =>
                              setContact({ ...contact, phone: e.target.value })
                            }
                          />
                        </div>
                        <div className="field">
                          <label>Abteilung</label>
                          <input
                            value={contact.department}
                            onChange={(e) =>
                              setContact({
                                ...contact,
                                department: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button className="btn btn-primary" type="submit">
                          Kontakt speichern
                        </button>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => setContactFor(null)}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
