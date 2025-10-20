// src/app/account/page.client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = { email: string };

export default function AccountClient({ email }: Props) {
  // fields
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");

  // UI
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [kind, setKind] = useState<"ok" | "err" | null>(null);

  // password helpers
  const tooShort = newPwd.length > 0 && newPwd.length < 8;
  const mismatch = confirm.length > 0 && newPwd !== confirm;

  const canSubmit = useMemo(() => {
    if (!newPwd || !confirm) return false;
    if (tooShort || mismatch) return false;
    return true;
  }, [newPwd, confirm, tooShort, mismatch]);

  useEffect(() => {
    setMsg(null);
    setKind(null);
  }, [newPwd, confirm, currentPwd]);

  async function tryUpdatePassword(): Promise<void> {
    // first attempt: direct update with current session
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (!error) return;

    const needsRecentLogin =
      /recent/i.test(error.message) ||
      /reauth/i.test(error.message) ||
      /invalid/i.test(error.message) ||
      /session/i.test(error.message);

    if (!needsRecentLogin) {
      throw error;
    }

    // If we need a fresh session, attempt re-login with current password and retry.
    if (!email || !currentPwd) {
      throw new Error(
        "This change requires your current password. Please enter it and try again."
      );
    }

    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPwd,
    });
    if (signErr) throw signErr;

    const { error: updErr2 } = await supabase.auth.updateUser({
      password: newPwd,
    });
    if (updErr2) throw updErr2;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setKind(null);

    if (tooShort) {
      setMsg("Password must be at least 8 characters.");
      setKind("err");
      return;
    }
    if (mismatch) {
      setMsg("Passwords do not match.");
      setKind("err");
      return;
    }

    setLoading(true);
    try {
      await tryUpdatePassword();
      setMsg("Password updated successfully.");
      setKind("ok");
      setCurrentPwd("");
      setNewPwd("");
      setConfirm("");
    } catch (err) {
      const text =
        (err as { message?: string })?.message ??
        "Failed to update password. Please try again.";
      setMsg(text);
      setKind("err");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)] transition-colors">
      {/* Header */}
      <section className="mx-auto max-w-4xl px-6 pt-8 pb-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Account
        </h1>
        <div className="accent-underline mt-3" />
        <p className="mt-3 text-sm md:text-base text-[var(--muted)] max-w-prose">
          Manage security for your account. You can update your password below.
        </p>
      </section>

      {/* Card */}
      <section className="mx-auto max-w-4xl px-6 pb-10">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            For security, you may be asked to confirm your current password.
          </p>

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            {/* Current password (optional but used for re-auth) */}
            <FieldPassword
              label="Current password"
              value={currentPwd}
              onChange={setCurrentPwd}
              placeholder="Enter current password (if prompted)"
              show={showCur}
              setShow={setShowCur}
              autoComplete="current-password"
              required={false}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldPassword
                label="New password"
                value={newPwd}
                onChange={setNewPwd}
                placeholder="Enter new password"
                show={showNew}
                setShow={setShowNew}
                autoComplete="new-password"
              />
              <FieldPassword
                label="Confirm new password"
                value={confirm}
                onChange={setConfirm}
                placeholder="Re-enter new password"
                show={showConf}
                setShow={setShowConf}
                autoComplete="new-password"
              />
            </div>

            {/* inline hints */}
            <div className="text-xs text-[var(--muted)]">
              • Minimum 8 characters. Consider a mix of letters, numbers, and
              symbols.
            </div>

            {msg && (
              <div
                className="mt-2 rounded-lg px-3 py-2 text-sm"
                style={{
                  border:
                    kind === "ok"
                      ? "1px solid color-mix(in oklab, var(--ok) 60%, transparent)"
                      : "1px solid color-mix(in oklab, var(--err) 60%, transparent)",
                  background:
                    kind === "ok"
                      ? "color-mix(in oklab, var(--ok) 8%, transparent)"
                      : "color-mix(in oklab, var(--err) 8%, transparent)",
                }}
              >
                {msg}
              </div>
            )}

            <div className="pt-1">
              <button
                disabled={!canSubmit || loading}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-semibold btn-primary",
                  "bg-[var(--accent)] disabled:opacity-60",
                  "shadow-[0_8px_24px_color-mix(in_oklab,var(--accent)_22%,transparent)]",
                ].join(" ")}
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

/* ---------------- small field component ---------------- */

function FieldPassword({
  label,
  value,
  onChange,
  placeholder,
  show,
  setShow,
  autoComplete,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  show: boolean;
  setShow: (v: boolean) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="group">
      <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </label>
      <div
        className={[
          "relative rounded-xl border bg-[var(--field)] border-[var(--border)]",
          "focus-within:border-[color:var(--accent)] transition-colors",
        ].join(" ")}
      >
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-xl px-3 py-2.5 pr-12 bg-transparent outline-none text-[var(--foreground)] placeholder:[color:var(--muted)]"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)]/85 hover:bg-[var(--background)]/60"
        >
          {show ? "Hide" : "Show"}
        </button>

        <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity glow-accent" />
      </div>
    </div>
  );
}
