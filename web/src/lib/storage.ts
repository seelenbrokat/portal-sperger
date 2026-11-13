export type Sendung = {
  id: string;
  referenz: string;
  absender: string;
  empfaenger: string;
  abholort: string;
  zustellort: string;
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

const SENDUNGEN_KEY = "sperger.sendungen";
const ZOLL_KEY = "sperger.zoll";

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

export function listSendungen(): Sendung[] {
  return readList<Sendung>(SENDUNGEN_KEY).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function saveSendung(entry: Omit<Sendung, "id" | "createdAt">): Sendung {
  const item: Sendung = {
    ...entry,
    id: `SND-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  const all = listSendungen();
  all.unshift(item);
  writeList(SENDUNGEN_KEY, all);
  return item;
}

export function listZollvorgaenge(): Zollvorgang[] {
  return readList<Zollvorgang>(ZOLL_KEY).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function saveZollvorgang(
  entry: Omit<Zollvorgang, "id" | "createdAt">,
): Zollvorgang {
  const item: Zollvorgang = {
    ...entry,
    id: `ZOL-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  const all = listZollvorgaenge();
  all.unshift(item);
  writeList(ZOLL_KEY, all);
  return item;
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
