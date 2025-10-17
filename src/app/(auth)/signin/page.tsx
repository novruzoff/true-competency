// src/app/(auth)/signin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Role = "trainee" | "instructor" | "committee";

/* ---------------- helpers: profile create/update ---------------- */
async function ensureProfile({
  id,
  email,
  role,
  first_name,
  last_name,
}: {
  id: string;
  email: string | null;
  role: Role;
  first_name?: string;
  last_name?: string;
}) {
  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) {
    if (first_name || last_name) {
      await supabase
        .from("profiles")
        .update({
          first_name: first_name ?? null,
          last_name: last_name ?? null,
          full_name:
            first_name || last_name
              ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
              : null,
        })
        .eq("id", id);
    }
    return;
  }

  const { error: insErr } = await supabase.from("profiles").insert({
    id,
    email: email ?? "",
    role,
    first_name: first_name ?? null,
    last_name: last_name ?? null,
    full_name:
      first_name || last_name
        ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
        : null,
  });
  if (insErr) throw insErr;
}

async function setProfileRole(userId: string, role: Role) {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw error;
}

/* ---------------- UI bits ---------------- */
function RoleChip({
  label,
  active,
  onClick,
}: {
  label: Role;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
        "backdrop-blur-sm",
        active
          ? "bg-[var(--accent)] text-white border-transparent shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_20%,transparent)]"
          : "bg-[color:var(--surface)]/70 text-[var(--foreground)]/85 border-[var(--border)] hover:bg-[var(--surface)]",
      ].join(" ")}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </button>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
}: {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
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
          "focus-within:border-[color:var(--accent)]",
          "transition-colors",
        ].join(" ")}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={[
            "w-full rounded-xl px-3 py-2.5 outline-none",
            "bg-transparent text-[var(--foreground)]",
            "placeholder:[color:var(--muted)]",
          ].join(" ")}
        />
        <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity glow-accent" />
      </div>
    </div>
  );
}

const ROLE_INFO: Record<Role, { title: string; points: string[] }> = {
  trainee: {
    title: "Trainee — Build your competency portfolio",
    points: [
      "Track progress across assigned competencies",
      "Answer case-based questions with instant feedback",
      "Build a performance record for instructors & committee",
    ],
  },
  instructor: {
    title: "Instructor — Assess and coach trainees",
    points: [
      "Assign competencies and monitor progress",
      "Review answers and provide targeted feedback",
      "Approve completed competencies",
    ],
  },
  committee: {
    title: "Committee — Govern standards and oversight",
    points: [
      "Manage frameworks and assessment standards",
      "See program-wide analytics and trends",
      "Approve new competencies & maintain compliance",
    ],
  },
};

/* ---------------- page ---------------- */
export default function SignInPage() {
  const router = useRouter();
  const [redirect, setRedirect] = useState<string>("/");
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const r = sp.get("redirect");
      if (r && typeof r === "string") setRedirect(r);
    } catch {}
  }, []);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("trainee");

  // Signup extras
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirm, setConfirm] = useState("");

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleInfo = useMemo(() => ROLE_INFO[role], [role]);

  function validate(): string | null {
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email.";
    if (mode === "signup") {
      if (!firstName.trim() || !lastName.trim())
        return "Please enter your first and last name.";
      if (password.length < 8) return "Password must be at least 8 characters.";
      if (password !== confirm) return "Passwords do not match.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              role,
            },
          },
        });
        if (error) throw error;

        if (data.user) {
          await ensureProfile({
            id: data.user.id,
            email: data.user.email ?? email,
            role,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          });
          await setProfileRole(data.user.id, role);
        }

        setMsg("Account created. You can now sign in.");
        setMode("signin");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          // ensure profile exists for legacy users
          await ensureProfile({
            id: data.user.id,
            email: data.user.email ?? email,
            role: "trainee",
          });
          router.replace(redirect || "/");
          return;
        }
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={[
        "relative min-h-[100dvh] overflow-hidden",
        "bg-gradient-to-b from-[#EEF4FF] to-white dark:from-[var(--background)] dark:to-[var(--background)]",
        "text-[var(--foreground)]",
      ].join(" ")}
    >
      {/* ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.25] blur-3xl"
      >
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[color:var(--accent)]/40 animate-float-slow" />
        <div className="absolute top-1/3 -right-10 h-80 w-80 rounded-full bg-[color:var(--accent)]/25 animate-float-slower" />
      </div>
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-60 dark:opacity-25"
      />
      <div
        aria-hidden
        className="bg-noise pointer-events-none absolute inset-0 opacity-[0.06]"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-12 md:py-16">
        {/* Brand */}
        <div className="mx-auto mb-8 flex flex-col items-center">
          <Image
            src="/TC_Logo.png"
            alt="True Competency"
            width={120}
            height={120}
            priority
            className="mb-2 drop-shadow-[0_8px_24px_color-mix(in_oklab,var(--accent)_35%,transparent)]"
          />
          <h1 className="text-center text-3xl font-semibold tracking-tight text-[var(--accent)]">
            True Competency
          </h1>
          <p className="mt-1 text-center text-sm text-[var(--muted)]">
            TCIP APSC IVUS Competency Platform
          </p>
          <span className="mt-2 inline-block rounded-full border px-3 py-1 text-xs border-[var(--border)] text-[var(--foreground)]/80 backdrop-blur-sm">
            Medical Training Portal
          </span>
        </div>

        {/* Main shell */}
        <div
          className={[
            "relative mx-auto grid max-w-4xl gap-6 rounded-3xl p-6 md:grid-cols-2 md:p-8",
            "border border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl",
            "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_40px_color-mix(in_oklab,var(--accent)_18%,transparent)]",
          ].join(" ")}
        >
          {/* LEFT: dynamic panel */}
          <div className="relative">
            <div className="sticky top-8 space-y-5">
              {mode === "signup" ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="h-1 w-28 rounded-full bg-[color:var(--accent)]/70" />
                  <h2 className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                    {roleInfo.title}
                  </h2>
                  <ul className="mt-2 space-y-2 text-sm text-[var(--foreground)]/90">
                    {roleInfo.points.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    What is True Competency?
                  </h2>
                  <p className="text-sm leading-6 text-[var(--muted)]">
                    A modern training platform for interventional cardiology —
                    structured evaluations, evidence collection, and transparent
                    progress tracking for trainees, instructors, and committees.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* RIGHT: auth form */}
          <div className="relative">
            {/* mode switch */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setMode("signin")}
                className={[
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  mode === "signin"
                    ? "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_18%,transparent)]"
                    : "bg-transparent text-[var(--muted)] border-[var(--border)]/50 hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                Sign in
              </button>
              <button
                onClick={() => setMode("signup")}
                className={[
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  mode === "signup"
                    ? "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_18%,transparent)]"
                    : "bg-transparent text-[var(--muted)] border-[var(--border)]/50 hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                Sign up
              </button>
            </div>

            {/* role selector (signup only) */}
            {mode === "signup" && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[var(--muted)]">I am a:</span>
                <RoleChip
                  label="trainee"
                  active={role === "trainee"}
                  onClick={() => setRole("trainee")}
                />
                <RoleChip
                  label="instructor"
                  active={role === "instructor"}
                  onClick={() => setRole("instructor")}
                />
                <RoleChip
                  label="committee"
                  active={role === "committee"}
                  onClick={() => setRole("committee")}
                />
              </div>
            )}

            {/* form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="First name"
                    type="text"
                    value={firstName}
                    onChange={setFirstName}
                    placeholder="Jane"
                    autoComplete="given-name"
                  />
                  <Field
                    label="Last name"
                    type="text"
                    value={lastName}
                    onChange={setLastName}
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                </div>
              )}

              <Field
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="user@example.com"
                autoComplete="email"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder={
                    mode === "signup" ? "Create a password" : "Enter password"
                  }
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                />
                {mode === "signup" && (
                  <Field
                    label="Confirm password"
                    type="password"
                    value={confirm}
                    onChange={setConfirm}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                )}
              </div>

              <button
                disabled={loading}
                className={[
                  "relative mt-2 w-full rounded-xl py-3 font-semibold btn-primary",
                  "bg-[var(--accent)] disabled:opacity-60",
                  "shadow-[0_10px_24px_color-mix(in_oklab,var(--accent)_26%,transparent)]",
                  "hover:scale-[1.01] active:scale-[0.99] transition-transform",
                ].join(" ")}
              >
                <span className="relative z-[1]">
                  {loading
                    ? "Please wait…"
                    : mode === "signup"
                    ? "Create Account"
                    : "Sign In"}
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
                >
                  <span className="absolute -inset-x-1 -top-1 h-1/2 opacity-30 blur-md shine" />
                </span>
              </button>
            </form>

            {/* divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-xs text-[var(--muted)]">or</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            {/* mode toggler text */}
            <p className="text-center text-sm text-[var(--foreground)]">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="font-medium underline underline-offset-2 text-[var(--accent)]"
                  >
                    Create account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="font-medium underline underline-offset-2 text-[var(--accent)]"
                  >
                    Sign in here
                  </button>
                </>
              )}
            </p>

            {msg && (
              <p className="mt-4 text-center text-sm text-red-500">{msg}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
