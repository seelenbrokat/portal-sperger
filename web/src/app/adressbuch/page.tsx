"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "../../components/PortalShell";
import {
  deleteAdresse,
  formatAddress,
  listAdressen,
  listKunden,
  saveAdresse,
  type Adresse,
  type Kunde,
} from "../../lib/storage";
import styles from "../erfassung.module.css";
import { Suspense } from "react";

const empty: {
  label: string;
  company: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  usage: Adresse["usage"];
  isDefault: boolean;
  customerRef: string;
} = {
  label: "",
  company: "",
  street: "",
  zip: "",
  city: "",
  country: "AT",
  usage: "BOTH",
  isDefault: false,
  customerRef: "",
};

function AdressbuchInner() {
  const params = useSearchParams();
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [kundeId, setKundeId] = useState("");
  const [items, setItems] = useState<Adresse[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function reload(selected?: string) {
    const list = listKunden().filter((k) => k.active);
    setKunden(list);
    const id = selected || kundeId || params.get("kunde") || list[0]?.id || "";
    setKundeId(id);
    setItems(id ? listAdressen(id) : []);
  }

  useEffect(() => {
    reload(params.get("kunde") || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setItems(kundeId ? listAdressen(kundeId) : []);
  }, [kundeId]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) =>
      `${a.company} ${a.label} ${a.street} ${a.zip} ${a.city} ${a.country} ${a.customerRef}`
        .toLowerCase()
        .includes(q),
    );
  }, [items, filter]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!kundeId) {
      setError("Bitte zuerst einen Kunden wählen.");
      return;
    }
    if (!form.street.trim() || !form.zip.trim() || !form.city.trim()) {
      setError("Straße, PLZ und Ort sind Pflichtfelder.");
      return;
    }
    saveAdresse({
      ...form,
      id: editId || undefined,
      kundeId,
      label: form.label.trim(),
      company: form.company.trim(),
      street: form.street.trim(),
      zip: form.zip.trim(),
      city: form.city.trim(),
      customerRef: form.customerRef.trim(),
    });
    setForm(empty);
    setEditId(null);
    setMessage(editId ? "Adresse aktualisiert." : "Adresse gespeichert.");
    setItems(listAdressen(kundeId));
  }

  return (
    <PortalShell
      title="Adressbuch"
      subtitle="Gespeicherte Abhol- und Zustelladressen je Kunde"
    >
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <div className="field" style={{ marginBottom: "0.9rem" }}>
            <label htmlFor="kunde">Kunde</label>
            <select
              id="kunde"
              value={kundeId}
              onChange={(e) => {
                setKundeId(e.target.value);
                setEditId(null);
                setForm(empty);
                setMessage("");
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

          <h2>{editId ? "Adresse bearbeiten" : "Neue Adresse"}</h2>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.grid2}>
              <div className="field">
                <label>Bezeichnung</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="z. B. Lager Wien"
                />
              </div>
              <div className="field">
                <label>Firma</label>
                <input
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Straße *</label>
              <input
                required
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
              />
            </div>
            <div className={styles.grid3}>
              <div className="field">
                <label>PLZ *</label>
                <input
                  required
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Ort *</label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Land</label>
                <select
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                >
                  <option value="AT">AT</option>
                  <option value="CH">CH</option>
                  <option value="DE">DE</option>
                  <option value="LI">LI</option>
                </select>
              </div>
            </div>
            <div className={styles.grid3}>
              <div className="field">
                <label>Verwendung</label>
                <select
                  value={form.usage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      usage: e.target.value as Adresse["usage"],
                    })
                  }
                >
                  <option value="BOTH">Abholung & Zustellung</option>
                  <option value="PICKUP">Nur Abholung</option>
                  <option value="DELIVERY">Nur Zustellung</option>
                </select>
              </div>
              <div className="field">
                <label>Kundenreferenz</label>
                <input
                  value={form.customerRef}
                  onChange={(e) =>
                    setForm({ ...form, customerRef: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Standard</label>
                <select
                  value={form.isDefault ? "1" : "0"}
                  onChange={(e) =>
                    setForm({ ...form, isDefault: e.target.value === "1" })
                  }
                >
                  <option value="0">Nein</option>
                  <option value="1">Ja</option>
                </select>
              </div>
            </div>

            {error ? <p className={styles.err}>{error}</p> : null}
            {message ? <p className={styles.ok}>{message}</p> : null}

            <div className={styles.actions}>
              <button className="btn btn-primary" type="submit">
                {editId ? "Aktualisieren" : "Adresse speichern"}
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
            <h2 style={{ margin: 0 }}>Adressen ({filtered.length})</h2>
            <div className="field" style={{ minWidth: 220 }}>
              <label htmlFor="filter">Suche</label>
              <input
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Firma, Ort, PLZ…"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className={styles.empty}>Keine Adressen für diesen Kunden.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Adresse</th>
                    <th>Verwendung</th>
                    <th>Ref.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.label || a.company || "Adresse"}</strong>
                        <div
                          style={{
                            color: "var(--sperger-muted)",
                            fontSize: "0.86rem",
                          }}
                        >
                          {formatAddress(a)}
                        </div>
                        {a.isDefault ? (
                          <span className={styles.badge}>Standard</span>
                        ) : null}
                      </td>
                      <td>
                        {a.usage === "BOTH"
                          ? "Beide"
                          : a.usage === "PICKUP"
                            ? "Abholung"
                            : "Zustellung"}
                      </td>
                      <td>{a.customerRef || "—"}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => {
                              setEditId(a.id);
                              setForm({
                                label: a.label,
                                company: a.company,
                                street: a.street,
                                zip: a.zip,
                                city: a.city,
                                country: a.country,
                                usage: a.usage,
                                isDefault: a.isDefault,
                                customerRef: a.customerRef,
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
                              if (
                                window.confirm(
                                  "Adresse wirklich löschen?",
                                )
                              ) {
                                deleteAdresse(a.id);
                                setItems(listAdressen(kundeId));
                                setMessage("Adresse gelöscht.");
                              }
                            }}
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
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

export default function AdressbuchPage() {
  return (
    <Suspense fallback={null}>
      <AdressbuchInner />
    </Suspense>
  );
}
