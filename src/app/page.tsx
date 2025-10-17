// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

type UserRole = "trainee" | "instructor" | "committee";
type Profile = { id: string; role: UserRole };
const ROLE_HOME: Record<Exclude<UserRole, "committee">, string> = {
  trainee: "/trainee",
  instructor: "/instructor",
};

export default function RootPage() {
  const [checking, setChecking] = useState(true);
  const [dashUrl, setDashUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: u, error } = await supabase.auth.getUser();
        if (error) throw error;
        const uid = u.user?.id ?? null;

        if (!uid) {
          if (!cancelled) {
            setDashUrl(null);
            setChecking(false);
          }
          return;
        }

        const { data: prof, error: perr } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", uid)
          .single<Profile>();
        if (perr) throw perr;

        const home =
          prof.role === "committee" ? "/committee" : ROLE_HOME[prof.role];

        if (!cancelled) {
          setDashUrl(home);
          setChecking(false);
        }
      } catch {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <Landing checking={checking} dashUrl={dashUrl} />;
}

function Landing({
  checking,
  dashUrl,
}: {
  checking: boolean;
  dashUrl: string | null;
}) {
  return (
    <div className="relative flex-1">
      {/* Background layers */}
      <div
        aria-hidden
        className="bg-grid absolute inset-0 opacity-60 dark:opacity-20"
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.06]" />
      <div aria-hidden className="beams pointer-events-none absolute inset-0" />

      {/* Hero: centered between header & footer */}
      <section className="relative z-10">
        <div
          className={[
            "mx-auto max-w-6xl px-6",
            "min-h-[calc(100svh-8rem)]", // 64px header + 64px footer
            "grid md:grid-cols-2 gap-10 items-center", // vertical centering
          ].join(" ")}
        >
          {/* LEFT: text */}
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              Competency-based training,
              <br />
              streamlined.
            </h2>
            <div className="accent-underline mt-4" />
            <p className="mt-6 max-w-prose text-sm md:text-base text-[var(--muted)] leading-relaxed">
              A modern portal for interventional cardiology: log procedures,
              collect evidence, request assessments, and track progress against
              program standards with clarity.
            </p>

            <div className="mt-8 flex items-center justify-center md:justify-start gap-4">
              {!dashUrl ? (
                <a
                  href="/signin"
                  className={[
                    "rounded-2xl px-6 py-3 font-semibold btn-primary",
                    "bg-[var(--accent)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]",
                    "hover:opacity-95 active:opacity-90 transition",
                  ].join(" ")}
                >
                  <span className="!text-white">
                    {checking ? "Checking session…" : "Sign In"}
                  </span>
                </a>
              ) : (
                <a
                  href={dashUrl}
                  className="rounded-2xl px-6 py-3 font-semibold bg-[var(--accent)] btn-primary shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] hover:opacity-95"
                >
                  <span className="!text-white">Continue</span>
                </a>
              )}

              <a
                href="mailto:novruzoff@truecompetency.com"
                className="rounded-2xl border border-[var(--border)] px-6 py-3 font-semibold text-[var(--foreground)] hover:bg-[color:var(--surface)]/60 transition"
              >
                Contact Us
              </a>
            </div>
          </div>

          {/* RIGHT: free-floating glowing logo (no borders) */}
          <div className="relative mx-auto w-full max-w-[520px] grid place-items-center">
            {/* halo + beam */}
            <div
              aria-hidden
              className="absolute -inset-10 blur-3xl opacity-70 logo-halo"
            />
            <div aria-hidden className="absolute -inset-2 rotate-12 opacity-35">
              <div className="logo-beam" />
            </div>

            {/* logo */}
            <Image
              src="/TC_Logo.png"
              alt="True Competency"
              width={240}
              height={240}
              className="relative z-[1] object-contain drop-shadow-[0_30px_90px_color-mix(in_oklab,var(--accent)_45%,transparent)]"
              priority
            />

            {/* pulsing aura */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[2rem] animate-pulse-glow"
              style={{
                filter:
                  "drop-shadow(0 0 80px color-mix(in oklab, var(--accent) 35%, transparent))",
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
