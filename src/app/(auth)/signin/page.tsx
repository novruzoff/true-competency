"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

type Role = "resident" | "attending" | "committee";

function TCMark() {
  // small stethoscope + heart mark used above the title
  return (
    <div className="mx-auto mb-4 flex items-center justify-center gap-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
        {/* stethoscope */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className=""
        >
          <path
            d="M6 4v5a4 4 0 0 0 8 0V4M6 6H4v3a6 6 0 1 0 12 0V6h-2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 14a3 3 0 1 0 0 6h1a3 3 0 0 0 0-6h-1z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        {/* heart */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.001 20.727c-.31 0-.62-.114-.858-.341l-6.89-6.55A5.502 5.502 0 0 1 7.7 3.5c1.271 0 2.49.46 3.4 1.3a5.06 5.06 0 0 1 .9 1.09 5.06 5.06 0 0 1 .9-1.09 5.2 5.2 0 0 1 3.4-1.3 5.5 5.5 0 0 1 4.447 9.336l-6.89 6.55c-.237.226-.547.341-.858.341z" />
        </svg>
      </span>
    </div>
  );
}

function RoleCard({
  title,
  desc,
  icon,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-xl border p-4 transition-colors",
        active
          ? "border-blue-600 ring-2 ring-blue-100 bg-white"
          : "border-gray-200 hover:border-gray-300 bg-white",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            "inline-flex h-9 w-9 items-center justify-center rounded-full",
            active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700",
          ].join(" ")}
        >
          {icon}
        </span>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-gray-600">{desc}</div>
        </div>
      </div>
    </button>
  );
}

export default function SignInPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("resident");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function upsertRole(userId: string, r: Role) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: r })
      .eq("id", userId);
    if (error) throw error;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await upsertRole(data.user.id, role);
          setMsg("Account created. You can now sign in.");
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) window.location.href = "/";
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setMsg(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      {/* Logo */}
      <div className="mb-6">
        <Image
          src="/TC_Logo.png"
          alt="True Competency Logo"
          width={120}
          height={120}
          priority
        />
      </div>

      {/* Sign-in form */}
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-semibold text-gray-800">
          Sign in to True Competency
        </h1>
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
