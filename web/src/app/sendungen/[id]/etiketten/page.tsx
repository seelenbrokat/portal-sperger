"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createLabelsPdf } from "../../../../lib/shipmentDocs";
import { getSendung } from "../../../../lib/storage";

/** Kompatibilität: leitet auf PDF-Erzeugung um (wie WOG POST /labels). */
export default function EtikettenRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const s = getSendung(params.id);
    if (!s) {
      setError("Sendung nicht gefunden.");
      return;
    }
    createLabelsPdf(s, "portal")
      .then(() => router.replace(`/sendungen/${s.id}`))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Etiketten fehlgeschlagen"),
      );
  }, [params.id, router]);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {error ? <p>{error}</p> : <p>Etiketten-PDF wird erstellt…</p>}
    </main>
  );
}
