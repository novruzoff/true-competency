"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Role = "trainee" | "instructor" | "committee";

// Cookie-backed Supabase client (no manual typing to avoid TS mismatch)
const supabase = createClientComponentClient();

/** Ensure a profiles row exists; if not, create it */
async function ensureProfile({
  id,
  email,
  role,
}: {
  id: string;
  email: string | null;
  role: Role;
}) {
  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return;

  const { error: insErr } = await supabase.from("profiles").insert({
    id,
    email: email ?? "",
    role,
  });
  if (insErr) throw insErr;
}

/** Update role if it changed */
async function setProfileRole(userId: string, role: Role) {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw error;
}

function RoleCard({
  title,
  desc,
  icon,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-xl border p-4 transition-colors",
        active
          ? "border-blue-600 ring-2 ring-blue-100 bg-white"
          : "border-gray-200 hover:border-gray-300 bg-white",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            "inline-flex h-9 w-9 items-center justify-center rounded-full",
            active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700",
          ].join(" ")}
        >
          {icon}
        </span>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-gray-600">{desc}</div>
        </div>
      </div>
    </button>
  );
}

export default function SignInPage() {
  const router = useRouter();

  // Read ?redirect=... only on client to avoid SSR suspense requirement
  const [redirect, setRedirect] = useState<string>("/");
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const r = sp.get("redirect");
      if (r && typeof r === "string") setRedirect(r);
    } catch {
      /* noop */
    }
  }, []);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("trainee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          await ensureProfile({
            id: data.user.id,
            email: data.user.email ?? email,
            role,
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
          // Safety net: ensure a profile exists (defaults to trainee)
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
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#EEF4FF] to-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Brand header */}
        <div className="mx-auto mb-4 flex flex-col items-center">
          <Image
            src="/TC_Logo.png"
            alt="True Competency"
            width={120}
            height={120}
            priority
            className="mb-2"
          />
          <h1 className="text-center text-3xl font-semibold tracking-tight text-[#4f75fc]">
            True Competency
          </h1>
          <p className="mt-1 text-center text-sm text-gray-600">
            Interventional Cardiology Training Platform
          </p>
          <span className="mt-2 inline-block rounded-full border px-3 py-1 text-xs text-gray-700">
            Medical Training Portal
          </span>
        </div>

        {/* Main card */}
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-white/90 p-6 shadow-xl ring-1 ring-gray-200">
          <h2 className="mb-1 text-center text-xl font-semibold text-[#4f75fc]">
            {mode === "signup" ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="mb-6 text-center text-sm text-gray-600">
            {mode === "signup"
              ? "Sign up to access your dashboard"
              : "Sign in to access your dashboard"}
          </p>

          {/* Role selector only on sign up */}
          {mode === "signup" && (
            <>
              <p className="mb-2 text-sm font-medium">I am a:</p>
              <div className="mb-6 grid gap-3">
                <RoleCard
                  title="Trainee"
                  desc="Track your competency progress"
                  active={role === "trainee"}
                  onClick={() => setRole("trainee")}
                  icon={<span>👨‍⚕️</span>}
                />
                <RoleCard
                  title="Instructor"
                  desc="Supervise and assess trainees"
                  active={role === "instructor"}
                  onClick={() => setRole("instructor")}
                  icon={<span>🩺</span>}
                />
                <RoleCard
                  title="Committee"
                  desc="Manage competency standards"
                  active={role === "committee"}
                  onClick={() => setRole("committee")}
                  icon={<span>🏛️</span>}
                />
              </div>
            </>
          )}

          {/* Auth form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-gray-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-gray-300"
              />
            </div>
            <button
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-[#0A0A14] py-2.5 font-medium text-white disabled:opacity-60"
            >
              {loading
                ? "Please wait…"
                : mode === "signup"
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <div className="my-4 border-t" />
          <p className="text-center text-sm">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="font-medium text-blue-600 underline-offset-2 hover:underline"
                >
                  Create account here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="font-medium text-blue-600 underline-offset-2 hover:underline"
                >
                  Sign in here
                </button>
              </>
            )}
          </p>

          {msg && (
            <p className="mt-4 text-center text-sm text-red-600">{msg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
