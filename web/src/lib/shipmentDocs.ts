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

function openPdf(dataUrl: string) {
  const win = window.open(dataUrl, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "dokument.pdf";
    a.click();
  }
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
    pdf.text(sendung.referenz, 5, 20);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    if (kunde) pdf.text(`Kunde: ${kunde.name}`, 5, 25);
    if (sendung.warenbeschreibung) {
      pdf.text(sendung.warenbeschreibung.slice(0, 60), 5, 30);
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
      .join(" · ");
    if (weightLine) pdf.text(weightLine, 55, 42);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(90, 102, 112);
    pdf.text("ABSENDER / ABHOLUNG", 5, 54);
    pdf.setTextColor(28, 36, 44);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    const abs = pdf.splitTextToSize(
      `${sendung.absender || "—"}\n${sendung.abholort}`,
      90,
    );
    pdf.text(abs, 5, 59);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(90, 102, 112);
    pdf.text("EMPFÄNGER / ZUSTELLUNG", 5, 78);
    pdf.setTextColor(28, 36, 44);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    const emp = pdf.splitTextToSize(
      `${sendung.empfaenger || "—"}\n${sendung.zustellort}`,
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

  const dataUrl = pdf.output("datauristring");
  const fileName = `Etiketten-${sendung.referenz}-${stamp()}.pdf`;
  const doc = saveDokument({
    sendungId: sendung.id,
    referenz: sendung.referenz,
    type: "LABEL",
    fileName,
    mimeType: "application/pdf",
    sizeBytes: Math.round((dataUrl.length * 3) / 4),
    dataUrl,
    note: `${total} Etikett(en) erstellt`,
    createdBy,
  });
  openPdf(dataUrl);
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
  pdf.text("Auftragsbestätigung / Ladeliste", 14, 30);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 102, 112);
  pdf.text(
    "Bestätigt die Erfassung und dient als Ladeliste für die Abholung.",
    14,
    36,
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(28, 36, 44);
  pdf.text(sendung.referenz, 196, 30, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 102, 112);
  pdf.text(`Erfasst ${formatWhen(sendung.createdAt)}`, 196, 36, {
    align: "right",
  });
  pdf.text(`Status: ${sendung.status}`, 196, 41, { align: "right" });

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
    pdf.text(title.toUpperCase(), x + 3, y + 5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(28, 36, 44);
    const lines = pdf.splitTextToSize(body, w - 6);
    pdf.text(lines, x + 3, y + 11);
  };

  box(
    14,
    48,
    88,
    28,
    "Kunde / Auftraggeber",
    `${kunde?.name || "—"}${kunde?.customerNumber ? `\nNr. ${kunde.customerNumber}` : ""}`,
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
    `${sendung.absender || "—"}\n${sendung.abholort}`,
  );
  box(
    108,
    80,
    88,
    32,
    "Zustellung",
    `${sendung.empfaenger || "—"}\n${sendung.zustellort}`,
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
    pdf.splitTextToSize(sendung.warenbeschreibung || "—", 88),
    cols[1],
    134,
  );
  pdf.text(sendung.colli || "—", cols[2], 134);
  pdf.text(sendung.gewichtKg ? `${sendung.gewichtKg} kg` : "—", cols[3], 134);
  pdf.text(sendung.lademeter || "—", cols[4], 134);

  pdf.setFontSize(8);
  pdf.setTextColor(90, 102, 112);
  pdf.text(
    "Dieses Dokument bestätigt die Übermittlung des Auftrags an Spedition Sperger und dient als Ladeliste für die Abholung.",
    14,
    270,
    { maxWidth: 182 },
  );
  pdf.text("zoll@spedition-sperger.at · spedition-sperger.at", 14, 278);

  const dataUrl = pdf.output("datauristring");
  const fileName = `Ladeliste-${sendung.referenz}-${stamp()}.pdf`;
  const doc = saveDokument({
    sendungId: sendung.id,
    referenz: sendung.referenz,
    type: "LOADING_LIST",
    fileName,
    mimeType: "application/pdf",
    sizeBytes: Math.round((dataUrl.length * 3) / 4),
    dataUrl,
    note: "Ladeliste / Auftragsbestätigung erstellt",
    createdBy,
  });
  openPdf(dataUrl);
  return doc;
}
