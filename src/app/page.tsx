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

/* -------------------------- Coming Soon (light) -------------------------- */

function ComingSoon({
  userEmail,
  checking,
}: {
  userEmail: string | null;
  checking: boolean;
}) {
  return (
    <main className="relative min-h-screen bg-white text-black overflow-hidden flex flex-col justify-between">
      {/* Soft accent glow */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[48rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(81,112,255,0.18), transparent 70%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="z-10 border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#5170ff]/10 grid place-items-center">
              <span className="text-xs font-bold tracking-wide text-[#5170ff]">
                TC
              </span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                True Competency
              </h1>
              <p className="text-xs text-gray-500">Interventional Cardiology</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {userEmail ? `Signed in as ${userEmail}` : "Not signed in"}
          </div>
        </div>
      </header>

      {/* Core section */}
      <section className="relative z-10 mx-auto max-w-5xl text-center px-6 pt-24 pb-28">
        <div className="mx-auto mb-10 h-28 w-28 rounded-full bg-[#5170ff]/10 border border-[#5170ff]/20 grid place-items-center shadow-[0_0_60px_15px_rgba(81,112,255,0.15)]">
          <span className="text-2xl font-bold tracking-tight text-[#5170ff]">
            TC
          </span>
        </div>

        <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-black to-[#5170ff]">
            Coming Soon
          </span>
        </h2>

        <p className="mt-6 text-gray-600 max-w-2xl mx-auto leading-relaxed">
          A modern platform for interventional cardiology training —
          competencies, assessments, and transparent progress tracking.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          {/* PRIMARY: force white label to beat inherited colors */}
          <a
            href="/signin"
            className="rounded-2xl px-6 py-3 font-semibold bg-[#5170ff] !text-white 
                       shadow-[0_8px_30px_rgba(81,112,255,0.25)]
                       hover:bg-[#3e5deb] active:bg-[#3654d6] transition-colors"
            style={{ color: "#fff" }}
          >
            <span className="!text-white">
              {checking ? "Checking session…" : "Sign In"}
            </span>
          </a>

          {/* Secondary */}
          <a
            href="mailto:novruzoff@truecompetency.com"
            className="rounded-2xl border border-gray-300 px-6 py-3 font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Contact Us
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="z-10 border-t border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-gray-600 flex items-center justify-between">
          <span>© {new Date().getFullYear()} True Competency</span>
          <span>Made with love</span>
        </div>
      </footer>
    </main>
  );
}
