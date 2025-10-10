// src/app/(auth)/signin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Role = "trainee" | "instructor" | "committee";
const ACCENT = "#5170ff";
const supabase = createClientComponentClient();

export default function SignInPage() {
  const router = useRouter();

  const [redirect, setRedirect] = useState("/");
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("redirect");
    if (r) setRedirect(r);
  }, []);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("trainee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => /\S+@\S+\.\S+/.test(email) && password.length >= 6,
    [email, password]
  );

  async function ensureProfile(id: string, em: string | null, r: Role) {
    const { error } = await supabase
      .from("profiles")
      .upsert({ id, email: em ?? "", role: r }, { onConflict: "id" });
    if (error) throw error;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await ensureProfile(data.user.id, data.user.email ?? email, role);
          setMsg("Account created. Please sign in.");
          setMode("signin");
        } else {
          setMsg("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) router.replace(redirect || "/");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Blue ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 -top-[26%] h-[1000px] w-[1500px] -translate-x-1/2 blur-3xl opacity-80"
          style={{
            background: `radial-gradient(40% 40% at 25% 20%, ${ACCENT}22 0%, transparent 60%),
                         radial-gradient(35% 35% at 75% 18%, ${ACCENT}1f 0%, transparent 65%),
                         radial-gradient(55% 55% at 50% 85%, ${ACCENT}1a 0%, transparent 65%)`,
          }}
        />
        <span className="absolute left-[10%] top-[28%] h-44 w-44 rounded-full bg-[rgba(81,112,255,0.12)] blur-3xl animate-[float_9s_ease-in-out_infinite]" />
        <span className="absolute right-[12%] top-[35%] h-36 w-36 rounded-full bg-[rgba(81,112,255,0.10)] blur-3xl animate-[float_12s_ease-in-out_infinite]" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-6 text-center">
          <div className="relative mx-auto h-24 w-24">
            <div
              aria-hidden
              className="absolute inset-0 blur-2xl"
              style={{
                background: `radial-gradient(circle, ${ACCENT}66 0%, transparent 58%)`,
              }}
            />
            <Image
              src="/TC_Logo.png"
              alt="True Competency"
              fill
              className="relative z-10 object-contain select-none"
              priority
            />
          </div>

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-[color:var(--accent)]">
            True Competency
          </h1>
          <p className="mt-2 text-sm md:text-base opacity-80">
            TCIP APSC IVUS Competency Platform
          </p>
          <span className="mt-3 inline-block rounded-full border border-[#5170ff33] bg-gradient-to-r from-[#5170ff1a] to-[#5170ff0d] px-4 py-1.5 text-xs font-medium text-[color:var(--accent)] shadow-[inset_0_0_14px_rgba(81,112,255,0.18)]">
            Medical Training Portal
          </span>
        </div>
      </header>

      {/* Card */}
      <main className="relative z-10">
        <div className="mx-auto max-w-md px-6 pb-16">
          <div className="relative rounded-2xl p-[1px] shadow-2xl ring-1 ring-[var(--border)] backdrop-blur">
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}59, transparent 35%),
                             linear-gradient(315deg, ${ACCENT}40, transparent 45%)`,
                filter: "blur(14px)",
              }}
            />
            <div className="relative rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6">
              <h2 className="text-center text-lg font-semibold text-[color:var(--accent)]">
                {mode === "signup" ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="mt-1 mb-6 text-center text-sm opacity-80">
                {mode === "signup"
                  ? "Sign up to access your dashboard"
                  : "Sign in to continue your learning journey"}
              </p>

              {mode === "signup" && (
                <RolePicker value={role} onChange={setRole} />
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@hospital.org"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent)]/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 pr-10 outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent)]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/30"
                    >
                      {showPw ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <div className="relative inline-block">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 translate-y-2 blur-2xl"
                      style={{
                        background: `radial-gradient(circle, ${ACCENT}33 0%, transparent 60%)`,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={loading || !canSubmit}
                      className="btn-primary relative z-10 rounded-xl bg-[color:var(--accent)] px-8 py-2.5 font-semibold shadow-[0_10px_30px_rgba(81,112,255,0.25)] transition hover:brightness-110 active:brightness-95 disabled:opacity-50"
                    >
                      {loading
                        ? "Please wait…"
                        : mode === "signup"
                        ? "Create"
                        : "Sign In"}
                    </button>
                  </div>
                </div>
              </form>

              {msg && (
                <div className="mt-4 text-center text-sm text-[color:var(--err)]">
                  {msg}
                </div>
              )}

              <p className="mt-6 text-center text-sm opacity-80">
                {mode === "signin" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => setMode("signup")}
                      className="font-medium text-[color:var(--accent)] hover:underline"
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("signin")}
                      className="font-medium text-[color:var(--accent)] hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>

              <div className="mt-6 flex justify-center gap-4 text-xs font-medium text-[color:var(--accent)]">
                <a href="#" className="hover:underline">
                  Terms
                </a>
                <span>•</span>
                <a href="#" className="hover:underline">
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 pb-10 text-center text-xs opacity-70">
        © {new Date().getFullYear()} True Competency. All rights reserved.
      </footer>

      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(14px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------ Bits ------------------ */

function RolePicker({
  value,
  onChange,
}: {
  value: Role;
  onChange: (r: Role) => void;
}) {
  const base =
    "w-full text-left rounded-xl border p-4 transition-colors bg-[var(--surface)] border-[var(--border)]";
  const active =
    "ring-2 ring-[color:var(--accent)]/20 border-[color:var(--accent)] shadow-[0_10px_30px_rgba(81,112,255,0.10)]";
  return (
    <div className="grid gap-3">
      <RoleCard
        title="Trainee"
        desc="Track your competency progress"
        active={value === "trainee"}
        onClick={() => onChange("trainee")}
        className={`${base} ${value === "trainee" ? active : ""}`}
      />
      <RoleCard
        title="Instructor"
        desc="Supervise and assess trainees"
        active={value === "instructor"}
        onClick={() => onChange("instructor")}
        className={`${base} ${value === "instructor" ? active : ""}`}
      />
      <RoleCard
        title="Committee"
        desc="Manage competency standards"
        active={value === "committee"}
        onClick={() => onChange("committee")}
        className={`${base} ${value === "committee" ? active : ""}`}
      />
    </div>
  );
}

function RoleCard({
  title,
  desc,
  active,
  onClick,
  className,
}: {
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button type="button" onClick={onClick} className={className}>
      <div className="flex items-center gap-3">
        <span
          className={[
            "inline-flex h-9 w-9 items-center justify-center rounded-full",
            active
              ? "bg-[color:var(--accent)] text-white"
              : "bg-[var(--field)] border border-[var(--border)]",
          ].join(" ")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="3" />
            <path d="M4 20a8 8 0 0 1 16 0" />
          </svg>
        </span>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm opacity-80">{desc}</div>
        </div>
      </div>
    </button>
  );
}

function IconEye() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.62-1.45 1.52-2.78 2.64-3.94" />
      <path d="M7.11 7.11C8.61 6.4 10.26 6 12 6c5 0 9.27 3.89 11 8-.36.84-.83 1.63-1.39 2.35" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
