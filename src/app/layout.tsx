// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";
import Header from "@/components/header";
import Footer from "@/components/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "True Competency",
  description: "Interventional Cardiology Training Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      {/* Body no longer controls flex — wrapper inside does */}
      <body className="font-sans bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          {/* FLEX WRAPPER: this is the key fix */}
          <div className="min-h-svh flex flex-col">
            <Header />
            <ThemeToggle />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
