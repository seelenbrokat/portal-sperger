"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PortalShell, usePortalEmail } from "../../../components/PortalShell";
import {
  createLabelsPdf,
  createLoadingListPdf,
  openStoredDocument,
} from "../../../lib/shipmentDocs";
import {
  DOC_TYPE_LABELS,
  deleteDokument,
  formatWhen,
  getKunde,
  getSendung,
  listDokumente,
  saveDokument,
  updateSendungStatus,
  type DocType,
  type Dokument,
  type Sendung,
} from "../../../lib/storage";
import styles from "../../erfassung.module.css";

const MAX_UPLOAD_BYTES = 1_500_000;

export default function SendungDetailPage() {
  const params = useParams<{ id: string }>();
  const email = usePortalEmail();
  const [sendung, setSendung] = useState<Sendung | null>(null);
  const [docs, setDocs] = useState<Dokument[]>([]);
  const [docType, setDocType] = useState<DocType>("CMR");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function reload() {
    const s = getSendung(params.id);
    setSendung(s);
    setDocs(s ? listDokumente(s.id) : []);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function createLabels() {
    if (!sendung) return;
    setError("");
    setMessage("");
    setBusy("labels");
    try {
      const doc = await createLabelsPdf(sendung, email || "portal");
      setMessage(`Etiketten-PDF erstellt und an die Sendung gehängt: ${doc.fileName}`);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Etiketten fehlgeschlagen");
    } finally {
      setBusy("");
    }
  }

  async function createLoadingList() {
    if (!sendung) return;
    setError("");
    setMessage("");
    setBusy("loading-list");
    try {
      const doc = await createLoadingListPdf(sendung, email || "portal");
      setMessage(`Ladeliste erstellt und an die Sendung gehängt: ${doc.fileName}`);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ladeliste fehlgeschlagen");
    } finally {
      setBusy("");
    }
  }

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!sendung) return;
    if (!file) {
      setError("Bitte eine Datei wählen.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Datei zu groß (max. ca. 1,5 MB im Browser-Speicher).");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
      reader.readAsDataURL(file);
    }).catch((err: Error) => {
      setError(err.message);
      return "";
    });
    if (!dataUrl) return;

    saveDokument({
      sendungId: sendung.id,
      referenz: sendung.referenz,
      type: docType,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      dataUrl,
      note: note.trim(),
      createdBy: email || "unbekannt",
    });
    setFile(null);
    setNote("");
    setMessage(`Dokument „${file.name}“ gespeichert.`);
    reload();
  }

  if (!sendung) {
    return (
      <PortalShell title="Sendung">
        <p className={styles.empty}>
          Sendung nicht gefunden. <Link href="/sendungen">Zur Sendungsliste</Link>
        </p>
      </PortalShell>
    );
  }

  const kunde = getKunde(sendung.kundeId);

  return (
    <PortalShell
      title={`Sendung ${sendung.referenz}`}
      subtitle="Etiketten und Ladeliste erstellen – Dokumente werden an die Sendung gehängt"
    >
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <div
            style={{
              background: "var(--sperger-blue-soft)",
              border: "1px solid var(--sperger-line)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <strong>Auftrag erfasst</strong>
            <p style={{ margin: "0.35rem 0 0.75rem", color: "var(--sperger-muted)" }}>
              Wie im WOG-Portal: Etiketten und Ladeliste / Auftragsbestätigung als PDF erzeugen.
              Die Dateien erscheinen unten bei den Dokumenten und öffnen sich zum Drucken.
            </p>
            <div className={styles.actions}>
              <button
                className="btn btn-primary"
                type="button"
                disabled={busy === "labels" || sendung.status === "Storniert"}
                onClick={createLabels}
              >
                {busy === "labels" ? "Etiketten werden erstellt…" : "Etiketten erstellen"}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                disabled={busy === "loading-list"}
                onClick={createLoadingList}
              >
                {busy === "loading-list"
                  ? "Ladeliste wird erstellt…"
                  : "Ladeliste / Auftragsbestätigung erstellen"}
              </button>
            </div>
          </div>

          {message ? <p className={styles.ok}>{message}</p> : null}
          {error ? <p className={styles.err}>{error}</p> : null}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <span className={styles.badge}>{sendung.status}</span>
            {kunde ? <span className={styles.badge}>{kunde.name}</span> : null}
          </div>

          <div className={styles.grid2}>
            <div>
              <strong>Abholung</strong>
              <p style={{ margin: "0.25rem 0 0" }}>
                {sendung.absender || "—"}
                <br />
                {sendung.abholort}
              </p>
            </div>
            <div>
              <strong>Zustellung</strong>
              <p style={{ margin: "0.25rem 0 0" }}>
                {sendung.empfaenger || "—"}
                <br />
                {sendung.zustellort}
              </p>
            </div>
          </div>

          <p style={{ margin: "0.9rem 0 0", color: "var(--sperger-muted)" }}>
            Colli {sendung.colli || "—"} · {sendung.gewichtKg || "—"} kg ·{" "}
            {sendung.lademeter || "—"} m
            {sendung.warenbeschreibung ? ` · ${sendung.warenbeschreibung}` : ""}
          </p>

          <div className={styles.actions} style={{ marginTop: "1rem" }}>
            <Link className="btn btn-secondary" href="/sendungen">
              Alle Sendungen
            </Link>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                updateSendungStatus(sendung.id, "Unterwegs");
                reload();
                setMessage("Status auf „Unterwegs“ gesetzt.");
              }}
            >
              Status: Unterwegs
            </button>
          </div>
        </section>

        <section className={styles.formCard}>
          <h2>Weiteres Dokument hochladen</h2>
          <p style={{ margin: "0 0 0.75rem", color: "var(--sperger-muted)" }}>
            CMR, Rechnung, Zollpapiere, POD u. a.
          </p>
          <form className={styles.form} onSubmit={onUpload}>
            <div className={styles.grid2}>
              <div className="field">
                <label htmlFor="docType">Dokumenttyp</label>
                <select
                  id="docType"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocType)}
                >
                  {(Object.keys(DOC_TYPE_LABELS) as DocType[])
                    .filter((t) => t !== "LABEL" && t !== "LOADING_LIST")
                    .map((t) => (
                      <option key={t} value={t}>
                        {DOC_TYPE_LABELS[t]}
                      </option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="file">Datei</label>
                <input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="note">Notiz</label>
              <input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className={styles.actions}>
              <button className="btn btn-primary" type="submit">
                Hochladen
              </button>
            </div>
          </form>
        </section>

        <section className={styles.listCard}>
          <h2>Dokumente zur Sendung ({docs.length})</h2>
          {docs.length === 0 ? (
            <p className={styles.empty}>
              Noch keine Dokumente. Oben Etiketten oder Ladeliste erstellen.
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Typ</th>
                    <th>Datei</th>
                    <th>Erfasst</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span className={styles.badge}>
                          {DOC_TYPE_LABELS[d.type]}
                        </span>
                      </td>
                      <td>
                        <strong>{d.fileName}</strong>
                        {d.note ? (
                          <div
                            style={{
                              color: "var(--sperger-muted)",
                              fontSize: "0.82rem",
                            }}
                          >
                            {d.note}
                          </div>
                        ) : null}
                      </td>
                      <td>{formatWhen(d.createdAt)}</td>
                      <td>
                        <div className={styles.actions}>
                          {d.dataUrl ? (
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={() => {
                                try {
                                  openStoredDocument(d);
                                } catch (err) {
                                  setError(
                                    err instanceof Error
                                      ? err.message
                                      : "Öffnen fehlgeschlagen",
                                  );
                                }
                              }}
                            >
                              Öffnen / Drucken
                            </button>
                          ) : null}
                          {d.dataUrl ? (
                            <a
                              className="btn btn-secondary"
                              href={d.dataUrl}
                              download={d.fileName}
                            >
                              Download
                            </a>
                          ) : null}
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => {
                              if (window.confirm("Dokument löschen?")) {
                                deleteDokument(d.id);
                                reload();
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
