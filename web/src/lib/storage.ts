export type Sendung = {
  id: string;
  referenz: string;
  kundeId?: string;
  absender: string;
  empfaenger: string;
  abholort: string;
  zustellort: string;
  abholAdresseId?: string;
  zustellAdresseId?: string;
  colli: string;
  gewichtKg: string;
  lademeter: string;
  warenbeschreibung: string;
  ladetermin: string;
  status: string;
  createdAt: string;
  createdBy: string;
};

export type Zollvorgang = {
  id: string;
  sendungsreferenz: string;
  kundeId?: string;
  richtung: "AT_CH" | "CH_AT";
  verfahren: string;
  warenart: string;
  tarifnummer: string;
  warenwert: string;
  waehrung: string;
  dokumente: string;
  bemerkung: string;
  status: string;
  createdAt: string;
  createdBy: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
};

export type Kunde = {
  id: string;
  name: string;
  customerNumber: string;
  matchcode: string;
  kind: "CUSTOMER" | "PARTNER";
  notes: string;
  contacts: Contact[];
  active: boolean;
  createdAt: string;
};

export type Adresse = {
  id: string;
  kundeId: string;
  label: string;
  company: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  usage: "PICKUP" | "DELIVERY" | "BOTH";
  isDefault: boolean;
  customerRef: string;
  createdAt: string;
};

export type Mandant = {
  id: string;
  code: string;
  name: string;
  legalName: string;
  active: boolean;
  createdAt: string;
};

export type Partner = {
  id: string;
  code: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  notes: string;
  active: boolean;
  createdAt: string;
};

export type DocType =
  | "LABEL"
  | "LOADING_LIST"
  | "CMR"
  | "INVOICE"
  | "CUSTOMS_PAPER"
  | "POD"
  | "ABLIEFERBELEG"
  | "CUSTOMER_UPLOAD"
  | "OTHER";

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  LABEL: "Etikett",
  LOADING_LIST: "Ladeliste",
  CMR: "CMR / Frachtbrief",
  INVOICE: "Rechnung",
  CUSTOMS_PAPER: "Zollpapier",
  POD: "POD",
  ABLIEFERBELEG: "Ablieferbeleg",
  CUSTOMER_UPLOAD: "Kundenupload",
  OTHER: "Sonstiges",
};

export type Dokument = {
  id: string;
  sendungId: string;
  referenz: string;
  type: DocType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** data URL for small browser-stored files; print stubs may be empty */
  dataUrl?: string;
  note: string;
  createdAt: string;
  createdBy: string;
};

const KEYS = {
  sendungen: "sperger.sendungen",
  zoll: "sperger.zoll",
  kunden: "sperger.kunden",
  adressen: "sperger.adressen",
  mandanten: "sperger.mandanten",
  partner: "sperger.partner",
  dokumente: "sperger.dokumente",
  seeded: "sperger.seed.v1",
} as const;

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;
}

export function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-AT", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Vienna",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatAddress(a: Adresse): string {
  const company = a.company || a.label || "Adresse";
  return `${company}, ${a.street}, ${a.zip} ${a.city} (${a.country})`;
}

/* ---------- Seed ---------- */

function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(KEYS.seeded)) return;

  const now = new Date().toISOString();
  const mandanten: Mandant[] = [
    {
      id: "MAN-SPG",
      code: "SPG",
      name: "Spedition Sperger",
      legalName: "Spedition Sperger GmbH",
      active: true,
      createdAt: now,
    },
    {
      id: "MAN-ZOLL",
      code: "ZOLL",
      name: "Zollagentur Sperger",
      legalName: "Spedition Sperger GmbH – Zollagentur",
      active: true,
      createdAt: now,
    },
  ];

  const kunden: Kunde[] = [
    {
      id: "KUN-001",
      name: "Musterindustrie AG",
      customerNumber: "10001",
      matchcode: "MUSTAG",
      kind: "CUSTOMER",
      notes: "Stammkunde AT → CH",
      contacts: [
        {
          id: "CT-001",
          name: "Anna Huber",
          email: "anna.huber@musterindustrie.example",
          phone: "+43 5577 000",
          department: "Logistik",
        },
      ],
      active: true,
      createdAt: now,
    },
    {
      id: "KUN-002",
      name: "Alpenhandel GmbH",
      customerNumber: "10002",
      matchcode: "ALPEN",
      kind: "CUSTOMER",
      notes: "",
      contacts: [
        {
          id: "CT-002",
          name: "Peter Keller",
          email: "p.keller@alpenhandel.example",
          phone: "+41 71 000 00 00",
          department: "Einkauf",
        },
      ],
      active: true,
      createdAt: now,
    },
  ];

  const adressen: Adresse[] = [
    {
      id: "ADR-001",
      kundeId: "KUN-001",
      label: "Werk Lustenau",
      company: "Musterindustrie AG",
      street: "Rheinstrasse 12",
      zip: "6890",
      city: "Lustenau",
      country: "AT",
      usage: "PICKUP",
      isDefault: true,
      customerRef: "MI-LUS",
      createdAt: now,
    },
    {
      id: "ADR-002",
      kundeId: "KUN-001",
      label: "Lager St. Gallen",
      company: "Musterindustrie AG CH",
      street: "Industriestrasse 8",
      zip: "9000",
      city: "St. Gallen",
      country: "CH",
      usage: "DELIVERY",
      isDefault: false,
      customerRef: "MI-SG",
      createdAt: now,
    },
    {
      id: "ADR-003",
      kundeId: "KUN-002",
      label: "Zentrale Zürich",
      company: "Alpenhandel GmbH",
      street: "Seefeldstrasse 45",
      zip: "8008",
      city: "Zürich",
      country: "CH",
      usage: "BOTH",
      isDefault: true,
      customerRef: "AH-ZH",
      createdAt: now,
    },
  ];

  const partner: Partner[] = [
    {
      id: "PAR-001",
      code: "CH-SUB",
      name: "Schweiz Subunternehmer AG",
      contact: "Marco Frei",
      email: "dispo@ch-sub.example",
      phone: "+41 44 000 00 00",
      notes: "Zustellung CH",
      active: true,
      createdAt: now,
    },
  ];

  writeList(KEYS.mandanten, mandanten);
  writeList(KEYS.kunden, kunden);
  writeList(KEYS.adressen, adressen);
  writeList(KEYS.partner, partner);
  window.localStorage.setItem(KEYS.seeded, "1");
}

export function ensureSeed() {
  seedIfNeeded();
}

/* ---------- Sendungen / Zoll ---------- */

export function listSendungen(): Sendung[] {
  ensureSeed();
  return readList<Sendung>(KEYS.sendungen).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getSendung(id: string): Sendung | null {
  return listSendungen().find((s) => s.id === id) || null;
}

export function getSendungByReferenz(referenz: string): Sendung | null {
  const ref = referenz.trim().toUpperCase();
  return listSendungen().find((s) => s.referenz === ref) || null;
}

export function saveSendung(entry: Omit<Sendung, "id" | "createdAt">): Sendung {
  ensureSeed();
  const item: Sendung = {
    ...entry,
    id: uid("SND"),
    createdAt: new Date().toISOString(),
  };
  const all = listSendungen();
  all.unshift(item);
  writeList(KEYS.sendungen, all);
  return item;
}

export function updateSendungStatus(id: string, status: string): Sendung | null {
  const all = listSendungen();
  const idx = all.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status };
  writeList(KEYS.sendungen, all);
  return all[idx];
}

/** GS1-ähnliche SSCC (18 Ziffern) für Etiketten – Demo, ohne GS1-Company-Prefix. */
export function buildSscc(sendungId: string, colloIndex: number): string {
  const idDigits = (sendungId.replace(/\D/g, "") || "0").padStart(6, "0").slice(-6);
  const timeDigits = String(Date.now()).replace(/\D/g, "").slice(-9).padStart(9, "0");
  const collo = String(Math.max(1, Math.min(9, colloIndex | 0)));
  const base = `3${timeDigits}${idDigits}${collo}`.replace(/\D/g, "").padEnd(17, "0").slice(0, 17);
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const n = Number(base[16 - i] || "0");
    sum += i % 2 === 0 ? n * 3 : n;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${base}${check}`;
}

export function colloCount(sendung: Sendung): number {
  const n = Number.parseInt(sendung.colli || "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 40);
}

export function listZollvorgaenge(): Zollvorgang[] {
  ensureSeed();
  return readList<Zollvorgang>(KEYS.zoll).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function saveZollvorgang(
  entry: Omit<Zollvorgang, "id" | "createdAt">,
): Zollvorgang {
  ensureSeed();
  const item: Zollvorgang = {
    ...entry,
    id: uid("ZOL"),
    createdAt: new Date().toISOString(),
  };
  const all = listZollvorgaenge();
  all.unshift(item);
  writeList(KEYS.zoll, all);
  return item;
}

/* ---------- Kunden ---------- */

export function listKunden(): Kunde[] {
  ensureSeed();
  return readList<Kunde>(KEYS.kunden).sort((a, b) =>
    a.name.localeCompare(b.name, "de"),
  );
}

export function saveKunde(
  entry: Omit<Kunde, "id" | "createdAt" | "contacts"> & {
    contacts?: Contact[];
    id?: string;
  },
): Kunde {
  ensureSeed();
  const all = listKunden();
  if (entry.id) {
    const idx = all.findIndex((k) => k.id === entry.id);
    if (idx >= 0) {
      const updated: Kunde = {
        ...all[idx],
        ...entry,
        contacts: entry.contacts ?? all[idx].contacts,
      };
      all[idx] = updated;
      writeList(KEYS.kunden, all);
      return updated;
    }
  }
  const item: Kunde = {
    id: uid("KUN"),
    name: entry.name,
    customerNumber: entry.customerNumber,
    matchcode: entry.matchcode,
    kind: entry.kind,
    notes: entry.notes,
    contacts: entry.contacts || [],
    active: entry.active,
    createdAt: new Date().toISOString(),
  };
  all.unshift(item);
  writeList(KEYS.kunden, all);
  return item;
}

export function addContact(kundeId: string, contact: Omit<Contact, "id">): Kunde | null {
  const all = listKunden();
  const idx = all.findIndex((k) => k.id === kundeId);
  if (idx < 0) return null;
  all[idx] = {
    ...all[idx],
    contacts: [...all[idx].contacts, { ...contact, id: uid("CT") }],
  };
  writeList(KEYS.kunden, all);
  return all[idx];
}

/* ---------- Adressen ---------- */

export function listAdressen(kundeId?: string): Adresse[] {
  ensureSeed();
  const all = readList<Adresse>(KEYS.adressen).sort((a, b) =>
    a.company.localeCompare(b.company, "de"),
  );
  return kundeId ? all.filter((a) => a.kundeId === kundeId) : all;
}

export function saveAdresse(
  entry: Omit<Adresse, "id" | "createdAt"> & { id?: string },
): Adresse {
  ensureSeed();
  const all = readList<Adresse>(KEYS.adressen);
  if (entry.id) {
    const idx = all.findIndex((a) => a.id === entry.id);
    if (idx >= 0) {
      const updated: Adresse = { ...all[idx], ...entry, id: entry.id };
      all[idx] = updated;
      writeList(KEYS.adressen, all);
      return updated;
    }
  }
  const item: Adresse = {
    id: uid("ADR"),
    kundeId: entry.kundeId,
    label: entry.label,
    company: entry.company,
    street: entry.street,
    zip: entry.zip,
    city: entry.city,
    country: entry.country,
    usage: entry.usage,
    isDefault: entry.isDefault,
    customerRef: entry.customerRef,
    createdAt: new Date().toISOString(),
  };
  if (item.isDefault) {
    for (const a of all) {
      if (a.kundeId === item.kundeId) a.isDefault = false;
    }
  }
  all.unshift(item);
  writeList(KEYS.adressen, all);
  return item;
}

export function deleteAdresse(id: string) {
  const all = listAdressen().filter((a) => a.id !== id);
  writeList(KEYS.adressen, all);
}

/* ---------- Mandanten ---------- */

export function listMandanten(): Mandant[] {
  ensureSeed();
  return readList<Mandant>(KEYS.mandanten);
}

export function saveMandant(
  entry: Omit<Mandant, "id" | "createdAt"> & { id?: string },
): Mandant {
  ensureSeed();
  const all = listMandanten();
  if (entry.id) {
    const idx = all.findIndex((m) => m.id === entry.id);
    if (idx >= 0) {
      const updated = { ...all[idx], ...entry, id: entry.id };
      all[idx] = updated;
      writeList(KEYS.mandanten, all);
      return updated;
    }
  }
  const item: Mandant = {
    id: uid("MAN"),
    code: entry.code,
    name: entry.name,
    legalName: entry.legalName,
    active: entry.active,
    createdAt: new Date().toISOString(),
  };
  all.push(item);
  writeList(KEYS.mandanten, all);
  return item;
}

/* ---------- Partner ---------- */

export function listPartner(): Partner[] {
  ensureSeed();
  return readList<Partner>(KEYS.partner).sort((a, b) =>
    a.name.localeCompare(b.name, "de"),
  );
}

export function savePartner(
  entry: Omit<Partner, "id" | "createdAt"> & { id?: string },
): Partner {
  ensureSeed();
  const all = listPartner();
  if (entry.id) {
    const idx = all.findIndex((p) => p.id === entry.id);
    if (idx >= 0) {
      const updated = { ...all[idx], ...entry, id: entry.id };
      all[idx] = updated;
      writeList(KEYS.partner, all);
      return updated;
    }
  }
  const item: Partner = {
    id: uid("PAR"),
    code: entry.code,
    name: entry.name,
    contact: entry.contact,
    email: entry.email,
    phone: entry.phone,
    notes: entry.notes,
    active: entry.active,
    createdAt: new Date().toISOString(),
  };
  all.unshift(item);
  writeList(KEYS.partner, all);
  return item;
}

/* ---------- Dokumente ---------- */

export function listDokumente(sendungId?: string): Dokument[] {
  ensureSeed();
  const all = readList<Dokument>(KEYS.dokumente).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return sendungId ? all.filter((d) => d.sendungId === sendungId) : all;
}

export function saveDokument(
  entry: Omit<Dokument, "id" | "createdAt">,
): Dokument {
  ensureSeed();
  const item: Dokument = {
    ...entry,
    id: uid("DOC"),
    createdAt: new Date().toISOString(),
  };
  const all = listDokumente();
  all.unshift(item);
  writeList(KEYS.dokumente, all);
  return item;
}

export function deleteDokument(id: string) {
  writeList(
    KEYS.dokumente,
    listDokumente().filter((d) => d.id !== id),
  );
}

export function recordPrintDocument(
  sendung: Sendung,
  type: "LABEL" | "LOADING_LIST",
  createdBy: string,
): Dokument {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const fileName =
    type === "LABEL"
      ? `Etiketten-${sendung.referenz}-${stamp}.pdf`
      : `Ladeliste-${sendung.referenz}-${stamp}.pdf`;
  return saveDokument({
    sendungId: sendung.id,
    referenz: sendung.referenz,
    type,
    fileName,
    mimeType: "application/pdf",
    sizeBytes: 0,
    note: type === "LABEL" ? "Etiketten-Druckansicht" : "Ladeliste / Auftragsbestätigung",
    createdBy,
  });
}

export function getKunde(id?: string): Kunde | null {
  if (!id) return null;
  return listKunden().find((k) => k.id === id) || null;
}
