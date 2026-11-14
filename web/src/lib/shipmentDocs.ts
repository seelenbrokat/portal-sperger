import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";
import {
  buildSscc,
  colloCount,
  formatWhen,
  getKunde,
  saveDokument,
  type Dokument,
  type Sendung,
} from "./storage";

function stamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

/** jsPDF Helvetica: Sonderzeichen ersetzen, die WinAnsi nicht kann. */
function pdfSafe(text: string): string {
  return String(text || "")
    .replace(/[—–]/g, "-")
    .replace(/[·•]/g, "-")
    .replace(/[„“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/\u00A0/g, " ");
}

function barcodeDataUrl(value: string): string {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, {
    format: "CODE128",
    displayValue: false,
    margin: 0,
    height: 60,
    width: 1.6,
    background: "#ffffff",
    lineColor: "#1c242c",
  });
  return canvas.toDataURL("image/png");
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("PDF konnte nicht gelesen werden."));
    reader.readAsDataURL(blob);
  });
}

/** Öffnet PDF zuverlässig per Blob-URL (data:-URLs werden von Chrome oft blockiert). */
function openPdfBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  // Blob-URL erst später freigeben, damit der Tab laden kann
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Erzeugt Etiketten-PDF (100×150 mm je Collo), speichert als Dokument an der Sendung. */
export async function createLabelsPdf(
  sendung: Sendung,
  createdBy: string,
): Promise<Dokument> {
  const total = colloCount(sendung);
  const kunde = getKunde(sendung.kundeId);
  const pdf = new jsPDF({
    unit: "mm",
    format: [100, 150],
    orientation: "portrait",
  });

  for (let i = 1; i <= total; i++) {
    if (i > 1) pdf.addPage([100, 150], "portrait");
    const sscc = buildSscc(sendung.id, i);

    pdf.setFillColor(0, 81, 146);
    pdf.rect(0, 0, 100, 12, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("SPEDITION SPERGER", 5, 8);

    pdf.setTextColor(28, 36, 44);
    pdf.setFontSize(12);
    pdf.text(pdfSafe(sendung.referenz), 5, 20);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    if (kunde) pdf.text(pdfSafe(`Kunde: ${kunde.name}`), 5, 25);
    if (sendung.warenbeschreibung) {
      pdf.text(pdfSafe(sendung.warenbeschreibung.slice(0, 60)), 5, 30);
    }

    pdf.setFillColor(230, 240, 248);
    pdf.roundedRect(5, 34, 90, 12, 1, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(`Collo ${i} / ${total}`, 8, 42);
    const weightLine = [
      sendung.gewichtKg ? `${sendung.gewichtKg} kg` : null,
      sendung.lademeter ? `${sendung.lademeter} m` : null,
    ]
      .filter(Boolean)
      .join(" / ");
    if (weightLine) pdf.text(pdfSafe(weightLine), 55, 42);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(90, 102, 112);
    pdf.text("ABSENDER / ABHOLUNG", 5, 54);
    pdf.setTextColor(28, 36, 44);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    const abs = pdf.splitTextToSize(
      pdfSafe(`${sendung.absender || "-"}\n${sendung.abholort}`),
      90,
    );
    pdf.text(abs, 5, 59);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(90, 102, 112);
    pdf.text("EMPFAENGER / ZUSTELLUNG", 5, 78);
    pdf.setTextColor(28, 36, 44);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    const emp = pdf.splitTextToSize(
      pdfSafe(`${sendung.empfaenger || "-"}\n${sendung.zustellort}`),
      90,
    );
    pdf.text(emp, 5, 83);

    try {
      const img = barcodeDataUrl(sscc);
      pdf.addImage(img, "PNG", 8, 110, 84, 22);
    } catch {
      /* barcode optional */
    }
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(`(00) ${sscc}`, 50, 138, { align: "center" });
  }

  const blob = pdf.output("blob");
  const dataUrl = await blobToDataUrl(blob);
  const fileName = `Etiketten-${sendung.referenz}-${stamp()}.pdf`;
  const doc = saveDokument({
    sendungId: sendung.id,
    referenz: sendung.referenz,
    type: "LABEL",
    fileName,
    mimeType: "application/pdf",
    sizeBytes: blob.size,
    dataUrl,
    note: `${total} Etikett(en) erstellt`,
    createdBy,
  });
  openPdfBlob(blob, fileName);
  return doc;
}

/** Erzeugt Ladeliste / Auftragsbestätigung als A4-PDF an der Sendung. */
export async function createLoadingListPdf(
  sendung: Sendung,
  createdBy: string,
): Promise<Dokument> {
  const kunde = getKunde(sendung.kundeId);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });

  pdf.setFillColor(0, 81, 146);
  pdf.rect(0, 0, 210, 18, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("SPEDITION SPERGER", 14, 12);

  pdf.setTextColor(0, 58, 107);
  pdf.setFontSize(16);
  pdf.text(pdfSafe("Auftragsbestaetigung / Ladeliste"), 14, 30);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 102, 112);
  pdf.text(
    pdfSafe(
      "Bestaetigt die Erfassung und dient als Ladeliste fuer die Abholung.",
    ),
    14,
    36,
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(28, 36, 44);
  pdf.text(pdfSafe(sendung.referenz), 196, 30, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 102, 112);
  pdf.text(pdfSafe(`Erfasst ${formatWhen(sendung.createdAt)}`), 196, 36, {
    align: "right",
  });
  pdf.text(pdfSafe(`Status: ${sendung.status}`), 196, 41, { align: "right" });

  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    body: string,
  ) => {
    pdf.setDrawColor(213, 221, 228);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(90, 102, 112);
    pdf.text(pdfSafe(title).toUpperCase(), x + 3, y + 5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(28, 36, 44);
    const lines = pdf.splitTextToSize(pdfSafe(body), w - 6);
    pdf.text(lines, x + 3, y + 11);
  };

  box(
    14,
    48,
    88,
    28,
    "Kunde / Auftraggeber",
    `${kunde?.name || "-"}${kunde?.customerNumber ? `\nNr. ${kunde.customerNumber}` : ""}`,
  );
  box(
    108,
    48,
    88,
    28,
    "Ladetermin",
    sendung.ladetermin
      ? formatWhen(new Date(sendung.ladetermin).toISOString())
      : "nach Absprache",
  );
  box(
    14,
    80,
    88,
    32,
    "Abholung",
    `${sendung.absender || "-"}\n${sendung.abholort}`,
  );
  box(
    108,
    80,
    88,
    32,
    "Zustellung",
    `${sendung.empfaenger || "-"}\n${sendung.zustellort}`,
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(90, 102, 112);
  const headers = ["Pos.", "Ware", "Colli", "Gewicht", "Lademeter"];
  const cols = [14, 28, 120, 145, 170];
  headers.forEach((h, i) => pdf.text(h.toUpperCase(), cols[i], 124));
  pdf.setDrawColor(213, 221, 228);
  pdf.line(14, 126, 196, 126);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(28, 36, 44);
  pdf.text("1", cols[0], 134);
  pdf.text(
    pdf.splitTextToSize(pdfSafe(sendung.warenbeschreibung || "-"), 88),
    cols[1],
    134,
  );
  pdf.text(pdfSafe(sendung.colli || "-"), cols[2], 134);
  pdf.text(
    pdfSafe(sendung.gewichtKg ? `${sendung.gewichtKg} kg` : "-"),
    cols[3],
    134,
  );
  pdf.text(pdfSafe(sendung.lademeter || "-"), cols[4], 134);

  pdf.setFontSize(8);
  pdf.setTextColor(90, 102, 112);
  pdf.text(
    pdfSafe(
      "Dieses Dokument bestaetigt die Uebermittlung des Auftrags an Spedition Sperger und dient als Ladeliste fuer die Abholung.",
    ),
    14,
    270,
    { maxWidth: 182 },
  );
  pdf.text("zoll@spedition-sperger.at · spedition-sperger.at".replace("·", "|"), 14, 278);

  const blob = pdf.output("blob");
  const dataUrl = await blobToDataUrl(blob);
  const fileName = `Ladeliste-${sendung.referenz}-${stamp()}.pdf`;
  const doc = saveDokument({
    sendungId: sendung.id,
    referenz: sendung.referenz,
    type: "LOADING_LIST",
    fileName,
    mimeType: "application/pdf",
    sizeBytes: blob.size,
    dataUrl,
    note: "Ladeliste / Auftragsbestaetigung erstellt",
    createdBy,
  });
  openPdfBlob(blob, fileName);
  return doc;
}

/** Öffnet ein gespeichertes Dokument (Blob statt data:-Navigation). */
export function openStoredDocument(doc: Dokument) {
  if (!doc.dataUrl) {
    throw new Error("Dokument hat keinen Inhalt.");
  }
  const parts = doc.dataUrl.split(",");
  const meta = parts[0] || "";
  const b64 = parts[1] || "";
  const mimeMatch = /data:([^;]+)/.exec(meta);
  const mime = mimeMatch?.[1] || doc.mimeType || "application/pdf";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  openPdfBlob(blob, doc.fileName);
}
