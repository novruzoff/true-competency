"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold mb-8">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* APPEARANCE */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-semibold mb-3">Appearance</h2>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-2">
            <span>Dark theme</span>
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
        </section>

        {/* NOTIFICATIONS */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-semibold mb-2">Notifications</h2>
          <p className="text-sm text-[var(--muted)] mb-2">
            Configure email or in-app notification preferences.
          </p>
          <button
            className="text-sm text-[color:var(--accent)] underline"
            disabled
          >
            Coming soon
          </button>
        </section>

        {/* ACCESSIBILITY */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-semibold mb-2">Accessibility</h2>
          <ul className="text-sm text-[var(--muted)] space-y-1">
            <li>• Enable high-contrast mode</li>
            <li>• Reduce motion / disable animations</li>
            <li>• Increase base font size</li>
          </ul>
        </section>

        {/* SECURITY */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-semibold mb-2">Security</h2>
          <button
            className="text-sm text-[color:var(--accent)] underline"
            disabled
          >
            Manage sessions — coming soon
          </button>
        </section>
      </div>
    </main>
  );
}
