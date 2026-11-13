"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./PortalShell.module.css";

type Session = { email: string; at: number };

const NAV = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/sendungserfassung", label: "Sendungserfassung" },
  { href: "/zollerfassung", label: "Zollerfassung" },
  { href: "/track", label: "Sendung verfolgen" },
];

export function PortalShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("sperger.session");
      if (!raw) {
        router.replace("/");
        return;
      }
      setSession(JSON.parse(raw) as Session);
    } catch {
      router.replace("/");
    }
  }, [router]);

  function logout() {
    window.sessionStorage.removeItem("sperger.session");
    router.push("/");
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.brand}>
          <Image
            src="/sperger-logo-retina.png"
            alt="Spedition Sperger"
            width={400}
            height={152}
          />
        </Link>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? styles.active : undefined}
            >
              {item.label}
            </Link>
          ))}
          <a href="mailto:zoll@spedition-sperger.at">Zoll kontaktieren</a>
          <button type="button" onClick={logout}>
            Abmelden
          </button>
        </nav>
      </aside>

      <main className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1>{title}</h1>
            <p>{subtitle || `Angemeldet als ${session.email}`}</p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

export function usePortalEmail(): string {
  const [email, setEmail] = useState("");
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("sperger.session");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Session;
      setEmail(parsed.email || "");
    } catch {
      /* ignore */
    }
  }, []);
  return email;
}
