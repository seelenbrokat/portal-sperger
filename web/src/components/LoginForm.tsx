"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../app/page.module.css";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    window.setTimeout(() => {
      if (!email || !password) {
        setError("Bitte E-Mail und Passwort eingeben.");
        setLoading(false);
        return;
      }

      // Eigenständiges Sperger-Portal: Session lokal, getrennt von WOG.
      window.sessionStorage.setItem(
        "sperger.session",
        JSON.stringify({ email, at: Date.now() }),
      );
      router.push("/dashboard");
    }, 350);
  }

  return (
    <form className={styles.authForm} onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="email">E-Mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="name@firma.at"
        />
      </div>
      <div className="field">
        <label htmlFor="password">Passwort</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error ? (
        <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: "0.9rem" }}>
          {error}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Anmeldung …" : "Einloggen"}
      </button>
    </form>
  );
}
