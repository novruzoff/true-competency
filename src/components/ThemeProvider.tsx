"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class" // toggles class="dark" on <html>
      defaultTheme="light" // light is default
      enableSystem={false} // ignore OS preference (your spec)
      storageKey="tc-theme" // persists choice
    >
      {children}
    </NextThemesProvider>
  );
}
