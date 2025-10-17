// src/app/not-found.tsx
"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

const fade: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }, // cubic-bezier
  },
};

const pop: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

const shimmer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function NotFound() {
  return (
    <motion.main
      initial="hidden"
      animate="show"
      variants={fade}
      className={[
        "relative min-h-[calc(100svh-8rem)]", // leave room if your layout has header+footer
        "flex items-center justify-center",
        "bg-[var(--background)] text-[var(--foreground)] overflow-hidden",
      ].join(" ")}
      role="main"
    >
      {/* subtle background speckle to match house style */}
      <div
        aria-hidden
        className="bg-grid absolute inset-0 opacity-50 dark:opacity-20"
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.05]" />

      {/* content */}
      <motion.div
        variants={pop}
        className="relative mx-auto w-full max-w-2xl px-6 text-center"
      >
        <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-[color:var(--accent)]/70" />
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
          404
        </h1>

        <motion.p
          variants={shimmer}
          className="mt-4 text-base md:text-lg text-[var(--muted)]"
        >
          The page you’re looking for doesn’t exist or has moved.
        </motion.p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl px-5 py-2.5 font-semibold btn-primary bg-[var(--accent)] shadow-[0_10px_24px_color-mix(in_oklab,var(--accent)_26%,transparent)] hover:opacity-95"
          >
            <span className="!text-white">Go home</span>
          </Link>
          <Link
            href="/signin"
            className="rounded-xl border border-[var(--border)] px-5 py-2.5 font-semibold text-[var(--foreground)] hover:bg-[color:var(--surface)]/60"
          >
            Sign in
          </Link>
        </div>
      </motion.div>

      {/* gentle accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 -inset-[15%] blur-3xl"
        style={{
          background:
            "radial-gradient(40rem 40rem at 50% 60%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 60%)",
        }}
      />
    </motion.main>
  );
}
