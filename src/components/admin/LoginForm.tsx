"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { en } from "@/locales/en";
import { BUTTON_PRIMARY } from "@/utils/ui.classes";
import { errorText } from "./errors";

/** One password field. On success the server sets the cookie; we refresh. */
export function LoginForm() {
  const router = useRouter();
  const t = en.admin;
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(errorText(body.error));
    } catch {
      setError(errorText());
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex max-w-md flex-col gap-5 bg-ink-2 p-7 cut"
      aria-labelledby="login-title"
    >
      <p className="m-0 label-mono text-xs font-extrabold text-bordeaux-hi">{t.kicker}</p>
      <h1 id="login-title" className="m-0 font-display text-5xl leading-none">
        {t.loginTitle}
      </h1>
      <p className="m-0 text-muted">{t.loginText}</p>
      <label className="flex flex-col gap-2">
        <span className="label-mono text-xs font-extrabold text-muted">{t.password}</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-13 w-full border-2 border-ink-3 bg-ink px-4 text-lg text-paper outline-none cut-s focus:border-tq"
        />
      </label>
      {error ? (
        <p role="alert" className="m-0 label-mono text-xs font-extrabold text-live">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className={`${BUTTON_PRIMARY} disabled:opacity-60`}
      >
        {t.login}
      </button>
    </form>
  );
}
