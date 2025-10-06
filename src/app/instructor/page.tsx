"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  role: "student" | "doctor";
  // display_name removed since your table doesn’t have it
};

type Overall = {
  student_id: string;
  overall_pct: number;
  topics_count: number;
};

type StudentWithOverall = { s: Profile; o?: Overall };

const T = {
  CANVAS: "#0b0c0f",
  SURFACE: "#121418",
  BORDER: "#1f232a",
  TEXT: "#e6e7ea",
  MUTED: "#9aa0a6",
  ACCENT: "#6ae6b2",
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

        // Doctor profile (only fetch fields that exist)
        const { data: doctor, error: profErr } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", uid)
          .single<Profile>();
        if (profErr) throw profErr;
        if (doctor.role !== "doctor")
          throw new Error("You must be a doctor to view this dashboard.");

        // Fetch assigned students
        const { data: rels, error: relErr } = await supabase
          .from("doctor_students")
          .select("student_id")
          .eq("doctor_id", doctor.id);
        if (relErr) throw relErr;

        const studentIds = (rels ?? []).map(
          (r: { student_id: string }) => r.student_id
        );
        if (studentIds.length === 0) {
          setStudents([]);
          setOverall([]);
          return;
        }

        // Profiles of those students
        const { data: profs, error: profsErr } = await supabase
          .from("profiles")
          .select("id, role")
          .in("id", studentIds);
        if (profsErr) throw profsErr;
        setStudents((profs ?? []) as Profile[]);

        // Overall progress
        const { data: agg, error: aggErr } = await supabase
          .from("student_overall_progress")
          .select("student_id, overall_pct, topics_count")
          .in("student_id", studentIds);
        if (aggErr) throw aggErr;
        setOverall((agg ?? []) as Overall[]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byStudent: StudentWithOverall[] = useMemo(() => {
    const map = new Map(overall.map((o) => [o.student_id, o]));
    return students
      .map((s) => ({ s, o: map.get(s.id) }))
      .sort((a, b) => (b.o?.overall_pct ?? 0) - (a.o?.overall_pct ?? 0));
  }, [students, overall]);

  return (
    <main style={{ minHeight: "100vh", background: T.CANVAS, color: T.TEXT }}>
      <header style={{ borderBottom: `1px solid ${T.BORDER}` }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>
            True Competency — Instructor
          </h1>
          <div style={{ fontSize: 13, color: T.MUTED }}>
            {email ?? "Not signed in"}
          </div>
        </div>
      </header>

      <section
        style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 24px" }}
      >
        {err && (
          <div
            style={{
              border: "1px solid #5c1d22",
              background: "#2a0f13",
              color: "#fecdd3",
              borderRadius: 12,
              padding: 10,
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {err}
          </div>
        )}

        {!loading && !err && byStudent.length === 0 && (
          <div style={{ color: T.MUTED }}>No students assigned yet.</div>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {byStudent.map(({ s, o }) => (
            <article
              key={s.id}
              style={{
                background: T.SURFACE,
                border: `1px solid ${T.BORDER}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {/* Fallback label since display_name doesn’t exist */}
                  <div style={{ fontWeight: 600 }}>
                    Student {s.id.slice(0, 8)}…
                  </div>
                  <div style={{ fontSize: 12, color: T.MUTED }}>
                    {o ? `${o.topics_count} topics` : "No topics"}
                  </div>
                </div>
                <a
                  href={`/doctor/student/${s.id}`}
                  style={{
                    fontSize: 13,
                    color: T.TEXT,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    opacity: 0.9,
                  }}
                >
                  View details →
                </a>
              </div>

              <div
                style={{
                  marginTop: 10,
                  height: 8,
                  width: "100%",
                  borderRadius: 999,
                  background: "#0c0d11",
                  outline: `1px solid ${T.BORDER}`,
                  overflow: "hidden",
                }}
                title={`${o?.overall_pct ?? 0}%`}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${o?.overall_pct ?? 0}%`,
                    background: T.ACCENT,
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
