"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle({
  className = "",
  floating = true,
}: {
  className?: string;
  floating?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={[
          "rounded-xl border px-3 py-2 text-sm",
          floating
            ? "fixed right-4 top-4 z-50 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow"
            : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]",
          className,
        ].join(" ")}
      >
        …
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={[
        "rounded-xl border px-3 py-2 text-sm hover:opacity-90",
        floating
          ? "fixed right-4 top-4 z-50 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow"
          : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]",
        className,
      ].join(" ")}
    >
      {isDark ? (
        // Sun icon (switch to light)
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon icon (switch to dark)
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
