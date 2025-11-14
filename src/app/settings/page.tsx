// src/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)] transition-colors">
      {/* Header */}
      <section className="mx-auto max-w-5xl px-6 lg:px-10 pt-8 pb-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Settings
        </h1>
        <div className="accent-underline mt-3" />
        <p className="mt-2 text-sm md:text-base text-[var(--muted)]">
          Adjust how True Competency looks on your device.
        </p>
      </section>

      {/* Appearance only */}
      <section className="mx-auto max-w-5xl px-6 lg:px-10 pb-10">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-7 space-y-4">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="text-sm text-[var(--muted)]">
            Switch between light and dark themes.
          </p>

          <div className="mt-2 flex items-center justify-between py-2">
            <span className="text-base font-medium">Dark theme</span>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`h-7 w-12 rounded-full border transition ${
                isDark
                  ? "bg-[color:var(--accent)] border-[color:var(--accent)]"
                  : "bg-[var(--field)] border-[var(--border)]"
              }`}
            >
              <span
                className={`block h-6 w-6 rounded-full bg-white shadow transform transition ${
                  isDark ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
