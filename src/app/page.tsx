// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

type UserRole = "trainee" | "instructor" | "committee";
type Profile = { id: string; role: UserRole };
const ROLE_HOME: Record<Exclude<UserRole, "committee">, string> = {
  trainee: "/trainee",
  instructor: "/instructor",
};

export default function RootPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: u, error } = await supabase.auth.getUser();
        if (error) throw error;
        const uid = u.user?.id ?? null;
        if (!uid) {
          if (!cancelled) setChecking(false);
          return;
        }
        setUserEmail(u.user?.email ?? null);

        const { data: prof, error: perr } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", uid)
          .single<Profile>();
        if (perr) throw perr;

        if (prof.role === "committee") router.replace("/committee");
        else router.replace(ROLE_HOME[prof.role]);
      } catch {
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <ComingSoon userEmail={userEmail} checking={checking} />;
}

/* -------------------------- Rockstar Coming Soon -------------------------- */

function ComingSoon({
  userEmail,
  checking,
}: {
  userEmail: string | null;
  checking: boolean;
}) {
  return (
    <main className="relative min-h-screen bg-[#000000] text-white overflow-hidden flex flex-col justify-between">
      {/* Animated Rockstar-style glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.08),transparent_60%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(106,230,178,0.25),transparent_70%)] blur-3xl opacity-70 animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      {/* Header */}
      <header className="z-10 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur grid place-items-center">
              <span className="text-xs font-bold tracking-wide">TC</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                True Competency
              </h1>
              <p className="text-xs text-white/60">Interventional Cardiology</p>
            </div>
          </div>
          <div className="text-sm text-white/60">
            {userEmail ? `Signed in as ${userEmail}` : "Not signed in"}
          </div>
        </div>
      </header>

      {/* Core section */}
      <section className="relative z-10 mx-auto max-w-5xl text-center px-6 pt-28 pb-32">
        <div className="mx-auto mb-10 h-28 w-28 rounded-full bg-white/5 border border-white/10 grid place-items-center shadow-[0_0_60px_15px_rgba(106,230,178,0.3)]">
          <span className="text-2xl font-bold tracking-tight">TC</span>
        </div>

        <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-[#6ae6b2] drop-shadow-[0_0_18px_rgba(106,230,178,0.4)]">
            Coming Soon
          </span>
        </h2>

        <p className="mt-6 text-white/70 max-w-2xl mx-auto leading-relaxed">
          A modern platform for interventional cardiology training —
          competencies, assessments, and transparent progress tracking.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="/signin"
            className="rounded-xl bg-white text-black px-6 py-3 font-semibold hover:bg-white/90 transition"
          >
            {checking ? "Checking session…" : "Sign In"}
          </a>
          <a
            href="mailto:hello@truecompetency.com"
            className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white/90 hover:border-white/40 transition"
          >
            Contact Us
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="z-10 border-t border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-white/50 flex items-center justify-between">
          <span>© {new Date().getFullYear()} True Competency</span>
          <span className="text-white/60">Made with ⚡️ discipline</span>
        </div>
      </footer>

      {/* Pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
