// src/app/instructor/page.client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

type ProgressRow = {
  student_id: string;
  pct: number;
};

type StudentSummary = {
  id: string;
  name: string;
  email: string;
  assignedCount: number;
  avgPct: number;
};

export default function InstructorClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        // We assume auth/role are already enforced by the server page.
        // Still fetch the user id to scope queries if needed.
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id ?? null;

        // If no user (rare race during dev/HMR), send to sign-in.
        if (!uid) {
          if (typeof window !== "undefined") {
            const r = encodeURIComponent("/instructor");
            window.location.assign(`/signin?redirect=${r}`);
          }
          return;
        }

        // 1) Pull progress across all students to aggregate per student
        const { data: progress, error: prErr } = await supabase
          .from("student_competency_progress")
          .select("student_id, pct")
          .returns<ProgressRow[]>();
        if (prErr) throw prErr;

        const byStudent = new Map<string, { count: number; sum: number }>();
        (progress ?? []).forEach((r) => {
          const cur = byStudent.get(r.student_id) ?? { count: 0, sum: 0 };
          cur.count += 1;
          cur.sum += r.pct;
          byStudent.set(r.student_id, cur);
        });

        const ids = [...byStudent.keys()];
        if (ids.length === 0) {
          if (!cancelled) {
            setStudents([]);
            setLoading(false);
          }
          return;
        }

        // 2) Load basic identity for those students
        const { data: profiles, error: sErr } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", ids)
          .returns<Profile[]>();
        if (sErr) throw sErr;

        const merged: StudentSummary[] = (profiles ?? []).map((p) => {
          const agg = byStudent.get(p.id)!;
          const name =
            [p.first_name ?? "", p.last_name ?? ""].join(" ").trim() ||
            "Unnamed trainee";
          const email = p.email ?? "";
          const assignedCount = agg.count;
          const avgPct = Math.round(agg.sum / Math.max(agg.count, 1));
          return { id: p.id, name, email, assignedCount, avgPct };
        });

        merged.sort((a, b) =>
          (a.name || a.email).localeCompare(b.name || b.email)
        );

        if (!cancelled) setStudents(merged);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(qq) || s.email.toLowerCase().includes(qq)
    );
  }, [q, students]);

  return (
    <main className="min-h-[calc(100svh-8rem)] bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <section className="mx-auto max-w-5xl px-6 pt-10 pb-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Instructor dashboard
        </h1>
        <div className="accent-underline mt-3" />
        <p className="mt-4 max-w-prose text-sm md:text-base text-[var(--muted)]">
          Your assigned trainees and their progress. Search a student to view
          details, grade answers, or manage assignments.
        </p>

        {/* Search */}
        <div className="mt-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--field)]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search students by name or email…"
              className="w-full bg-transparent px-3 py-2.5 outline-none placeholder:[color:var(--muted)]"
            />
          </div>
        </div>

        {/* Data / Errors */}
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {loading && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl border border-[var(--border)] bg-[var(--surface)] animate-pulse"
                />
              ))}
            </>
          )}

          {!loading && err && (
            <div className="col-span-full rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          )}

          {!loading && !err && filtered.length === 0 && (
            <div className="text-sm text-[var(--muted)]">No students yet.</div>
          )}

          {!loading &&
            !err &&
            filtered.map((s) => (
              <article
                key={s.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold leading-tight">{s.name}</h3>
                    <div className="text-xs text-[var(--muted)]">{s.email}</div>
                  </div>
                  <span className="rounded-full bg-[color:var(--accent)] px-2.5 py-1 text-[10px] font-bold text-white">
                    {s.assignedCount} topic{s.assignedCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-3 text-xs text-[var(--muted)]">
                  Average progress:{" "}
                  <span className="text-[var(--foreground)] font-medium">
                    {s.avgPct}%
                  </span>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--field)]">
                  <div
                    className="h-full"
                    style={{
                      width: `${s.avgPct}%`,
                      background: "var(--accent)",
                      boxShadow:
                        "0 0 0 1px color-mix(in oklab, var(--accent) 20%, transparent) inset",
                    }}
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/instructor/student/${s.id}`}
                    className="text-sm text-[var(--accent)] underline underline-offset-4 hover:opacity-80"
                    title="Open student details"
                  >
                    Open →
                  </Link>
                </div>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}
