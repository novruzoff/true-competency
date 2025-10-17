// src/app/not-found.tsx
"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const fade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

const rise = (delay = 0) => ({
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay },
  },
});

const pop = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function NotFound() {
  return (
    <motion.main
      className="relative flex min-h-screen flex-col items-center justify-center text-center overflow-hidden"
      initial="hidden"
      animate="show"
      variants={fade}
    >
      {/* Background layers to match house style */}
      <div
        aria-hidden
        className="bg-grid absolute inset-0 opacity-60 dark:opacity-20"
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.06]" />
      <div aria-hidden className="beams pointer-events-none absolute inset-0" />

      <section className="relative z-10 px-6">
        <AnimatePresence>
          <motion.h1
            className="text-7xl md:text-8xl font-extrabold text-[var(--accent)] tracking-tight"
            variants={pop}
          >
            404
          </motion.h1>

          <motion.h2
            className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight"
            variants={rise(0.05)}
          >
            Page not found
          </motion.h2>

          <motion.p
            className="mt-3 max-w-lg mx-auto text-[var(--muted)] text-sm md:text-base leading-relaxed"
            variants={rise(0.12)}
          >
            The page you’re looking for doesn’t exist, was removed, or is
            temporarily unavailable.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-4"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.18 },
              },
            }}
          >
            <motion.span variants={rise(0)}>
              <Link
                href="/"
                className="rounded-2xl px-6 py-3 font-semibold bg-[var(--accent)] text-white
                           shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]
                           hover:opacity-95 active:opacity-90 transition"
              >
                Go Home
              </Link>
            </motion.span>

            <motion.span variants={rise(0)}>
              <Link
                href="/signin"
                className="rounded-2xl border border-[var(--border)] px-6 py-3 font-semibold
                           text-[var(--foreground)] hover:bg-[color:var(--surface)]/60 transition"
              >
                Sign In
              </Link>
            </motion.span>

            <motion.span variants={rise(0)}>
              <a
                href="mailto:novruzoff@truecompetency.com?subject=Broken%20link%20on%20True%20Competency"
                className="rounded-2xl border border-[var(--border)] px-6 py-3 font-semibold
                           text-[var(--foreground)] hover:bg-[color:var(--surface)]/60 transition"
              >
                Report Issue
              </a>
            </motion.span>
          </motion.div>
        </AnimatePresence>
      </section>
    </motion.main>
  );
}
