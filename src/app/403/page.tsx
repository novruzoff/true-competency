// src/app/403/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function ForbiddenPage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center text-center bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      {/* Floating accent blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.25] blur-3xl"
      >
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[color:var(--accent)]/40 animate-float-slow" />
        <div className="absolute top-1/3 -right-10 h-80 w-80 rounded-full bg-[color:var(--accent)]/25 animate-float-slower" />
      </div>

      {/* Grid + noise */}
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-60 dark:opacity-25"
      />
      <div
        aria-hidden
        className="bg-noise pointer-events-none absolute inset-0 opacity-[0.06]"
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 px-6"
      >
        <h1 className="text-[6rem] font-bold text-[var(--accent)] leading-none tracking-tight">
          403
        </h1>
        <p className="mt-2 text-lg font-medium text-[var(--foreground)]">
          Access forbidden
        </p>
        <p className="mt-1 text-sm text-[var(--muted)] max-w-sm mx-auto">
          You don’t have permission to view this page.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-white font-medium shadow-[0_8px_20px_color-mix(in_oklab,var(--accent)_25%,transparent)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Go back home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
