"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  display_name: string | null;
  role: "student" | "doctor";
};

type Overall = {
  student_id: string;
  overall_pct: number;
  topics_count: number;
};

type StudentWithOverall = {
  s: Profile;
  o: Overall | undefined;
};

export default function DoctorDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [students, setStudents] = useState<Profile[]>([]);
  const [overall, setOverall] = useState<Overall[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const { data: userRes, error: getUserErr } =
          await supabase.auth.getUser();
        if (getUserErr) throw getUserErr;
        const uid = userRes.user?.id ?? null;
        setEmail(userRes.user?.email ?? null);
        if (!uid) throw new Error("Not signed in");

        const { data: doctor, error: profErr } = await supabase
          .from("profiles")
          .select("id, display_name, role")
          .eq("id", uid)
          .single<Profile>();
        if (profErr) throw profErr;
        if (doctor.role !== "doctor")
          throw new Error("You must be a doctor to view this dashboard.");
        if (cancelled) return;

        const { data: rels, error: relErr } = await supabase
          .from("doctor_students")
          .select("student_id")
          .eq("doctor_id", doctor.id);
        if (relErr) throw relErr;
        if (cancelled) return;

        const studentIds = (rels ?? []).map(
          (r: { student_id: string }) => r.student_id
        );
        if (studentIds.length === 0) {
          setStudents([]);
          setOverall([]);
          return;
        }

        const { data: profs, error: profsErr } = await supabase
          .from("profiles")
          .select("id, display_name, role")
          .in("id", studentIds);
        if (profsErr) throw profsErr;
        if (cancelled) return;

        setStudents((profs ?? []) as Profile[]);

        const { data: agg, error: aggErr } = await supabase
          .from("student_overall_progress")
          .select("student_id, overall_pct, topics_count")
          .in("student_id", studentIds);
        if (aggErr) throw aggErr;
        if (cancelled) return;

        setOverall((agg ?? []) as Overall[]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const byStudent: StudentWithOverall[] = useMemo(() => {
    const map = new Map<string, Overall>(overall.map((o) => [o.student_id, o]));
    const list = students.map((s) => ({ s, o: map.get(s.id) }));
    list.sort((a, b) => (b.o?.overall_pct ?? 0) - (a.o?.overall_pct ?? 0));
    return list;
  }, [students, overall]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <h1 className="text-lg font-semibold">True Competency — Doctor</h1>
          <div className="text-sm text-neutral-400">
            {email ?? "Not signed in"}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-6">
        <h2 className="text-base font-medium mb-4">Your Students</h2>

        {loading && <div className="text-neutral-400">Loading…</div>}
        {err && (
          <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {!loading && !err && byStudent.length === 0 && (
          <div className="text-neutral-400">No students assigned yet.</div>
        )}

        <div className="space-y-3">
          {byStudent.map(({ s, o }) => (
            <article
              key={s.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {s.display_name ?? "(no name)"}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {o ? `${o.topics_count} topics` : "No topics"}
                  </div>
                </div>
                <a
                  className="text-sm underline underline-offset-4 hover:text-white"
                  href={`/doctor/student/${s.id}`}
                >
                  View details →
                </a>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-neutral-100"
                  style={{ width: `${o?.overall_pct ?? 0}%` }}
                  title={`${o?.overall_pct ?? 0}%`}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
