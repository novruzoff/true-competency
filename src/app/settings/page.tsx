// src/app/settings/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabaseClient";
import CountrySelect from "@/components/CountrySelect";

type ProfileRow = {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  country_code: string | null;
  country_name: string | null;
  university: string | null;
  hospital: string | null;
};

type CountryRow = {
  code: string;
  name: string;
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // profile-related state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  // editable fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [countryName, setCountryName] = useState<string>("");
  const [university, setUniversity] = useState("");
  const [hospital, setHospital] = useState("");

  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";

  // load profile + countries
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!user) throw new Error("Not signed in.");

        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select(
            "id,email,role,first_name,last_name,full_name,country_code,country_name,university,hospital"
          )
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        if (profErr) throw profErr;
        if (!prof) throw new Error("Profile not found.");

        const { data: cData, error: cErr } = await supabase
          .from("countries")
          .select("code,name")
          .order("name", { ascending: true });
        if (cErr) {
          console.warn("countries load error", cErr.message);
        }

        if (active) {
          setProfile(prof);
          setEmail(prof.email);
          setFirstName(prof.first_name ?? "");
          setLastName(prof.last_name ?? "");
          setFullName(prof.full_name ?? "");
          setCountryCode(prof.country_code ?? "");
          setCountryName(prof.country_name ?? "");
          setUniversity(prof.university ?? "");
          setHospital(prof.hospital ?? "");
          setCountries(cData ?? []);
        }
      } catch (e) {
        if (active) {
          setErr(
            e instanceof Error ? e.message : "Failed to load your settings."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  // auto compose full name
  useEffect(() => {
    const composed = [firstName.trim(), lastName.trim()]
      .filter(Boolean)
      .join(" ");
    if (composed && !fullName.trim()) {
      setFullName(composed);
    }
  }, [firstName, lastName, fullName]);

  const resolveCountryName = useCallback(
    (code: string): string => {
      if (!code) return "";
      const found = countries.find(
        (c) => c.code.toUpperCase() === code.toUpperCase()
      );
      return found ? found.name : "";
    },
    [countries]
  );

  function handleCountryChange(code: string) {
    const upper = (code || "").toUpperCase();
    setCountryCode(upper);
    const resolved = resolveCountryName(upper);
    setCountryName(resolved || "");
  }

  function isValidEmail(val: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setErr("Please enter a valid email address (like name@example.com).");
      return;
    }
    if (!profile) return;
    setSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const payload = {
        email: email.trim(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        full_name: fullName.trim() || null,
        country_code: countryCode || null,
        country_name: countryName || null,
        university:
          profile.role === "trainee"
            ? university.trim() || null
            : profile.university,
        hospital:
          profile.role === "instructor"
            ? hospital.trim() || null
            : profile.hospital,
      };

      // update profiles
      const { error: updErr } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", profile.id);
      if (updErr) throw updErr;

      // update auth user (metadata + email)
      const { error: authErr } = await supabase.auth.updateUser({
        email: payload.email,
        data: {
          first_name: payload.first_name,
          last_name: payload.last_name,
          full_name: payload.full_name,
          country_code: payload.country_code,
          country_name: payload.country_name,
          university: payload.university,
          hospital: payload.hospital,
        },
      });
      if (authErr) {
        // email change may require re-auth; show soft error but keep profile update
        console.warn("auth update failed:", authErr.message);
        setMsg(
          "Profile updated. Email change may require re-login/confirmation."
        );
      } else {
        setMsg("Profile updated.");
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              email: payload.email,
              first_name: payload.first_name,
              last_name: payload.last_name,
              full_name: payload.full_name,
              country_code: payload.country_code,
              country_name: payload.country_name,
              university: payload.university,
              hospital: payload.hospital,
            }
          : prev
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 lg:px-10 py-10 space-y-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Settings
          </h1>
          <div className="accent-underline mt-3" />
          <p className="mt-2 text-sm md:text-base text-[var(--muted)]">
            Update your account and profile information.
          </p>
        </div>
        {msg && (
          <div className="rounded-lg bg-emerald-500/90 text-white px-3 py-1.5 text-sm shadow">
            {msg}
          </div>
        )}
      </div>

      {err && (
        <p className="rounded-lg bg-red-950/30 border border-red-700/40 px-3 py-2 text-sm text-red-100">
          {err}
        </p>
      )}

      {/* PROFILE */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-7 space-y-5">
        <h2 className="text-lg font-semibold">Profile</h2>

        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : !profile ? (
          <p className="text-sm text-[var(--muted)]">No profile found.</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">First name</span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 outline-none focus:border-[color:var(--accent)]"
                  placeholder="Jane"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Last name</span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 outline-none focus:border-[color:var(--accent)]"
                  placeholder="Doe"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 outline-none focus:border-[color:var(--accent)]"
                placeholder="Jane Doe"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 outline-none focus:border-[color:var(--accent)]"
                placeholder="you@example.com"
              />
            </label>

            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">
                Country <span className="text-red-500">*</span>
              </span>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--field)] p-1.5">
                <CountrySelect
                  value={countryCode || null}
                  onChange={handleCountryChange}
                  placeholder="Select your country…"
                />
              </div>
              {countryName ? (
                <p className="text-xs text-[var(--muted)]">{countryName}</p>
              ) : null}
            </div>

            {profile.role === "trainee" && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">University (optional)</span>
                <input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 outline-none focus:border-[color:var(--accent)]"
                  placeholder="e.g. McGill University"
                />
              </label>
            )}
            {profile.role === "instructor" && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Hospital (optional)</span>
                <input
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 outline-none focus:border-[color:var(--accent)]"
                  placeholder="e.g. Queen Elizabeth Hospital"
                />
              </label>
            )}

            <div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white shadow hover:scale-[1.01] active:scale-[0.995] transition-transform disabled:opacity-70"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* APPEARANCE */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-7 space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>

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
    </main>
  );
}
