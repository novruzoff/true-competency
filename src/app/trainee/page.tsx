"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const THEME = {
  CANVAS: "#0b0c0f",
  SURFACE: "#121418",
  BORDER: "#1f232a",
  TEXT: "#e6e7ea",
  MUTED: "#9aa0a6",
  ACCENT: "#6ae6b2",
};

type Competency = {
  id: string;
  name?: string | null;
  difficulty?: string | null;
  tags?: string[] | null;
  test_question?: string | null;
  created_at?: string | null;
};

type ProgressRow = {
  student_id: string;
  competency_id: string;
  total_questions: number;
  answered_questions: number;
  pct: number;
};

type Profile = {
  id: string;
  role: "student" | "doctor";
};

export default function StudentDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<
    Array<ProgressRow & { competency: Competency }>
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [competenciesVisible, setCompetenciesVisible] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      setCompetenciesVisible(null);

      try {
        // Session
        const { data: userRes, error: getUserErr } =
          await supabase.auth.getUser();
        if (getUserErr) throw getUserErr;
        const uid = userRes.user?.id ?? null;
        setEmail(userRes.user?.email ?? null);
        if (!uid) throw new Error("Not signed in");

        // Profile (only fields that exist in your DB)
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("id, role") // removed display_name (doesn't exist)
          .eq("id", uid)
          .single<Profile>();
        if (profErr) throw profErr;
        if (cancelled) return;

        // Progress rows for this student
        const { data: progress, error: progErr } = await supabase
          .from("student_competency_progress")
          .select(
            "student_id, competency_id, total_questions, answered_questions, pct"
          )
          .eq("student_id", prof.id);
        if (progErr) throw progErr;
        if (cancelled) return;

        const progressRows: ProgressRow[] = (progress ?? []) as ProgressRow[];
        if (progressRows.length === 0) {
          setRows([]);
          setCompetenciesVisible(true); // doesn’t matter; nothing to display
          return;
        }

        // Try to fetch competencies; handle 0 rows gracefully
        const ids = Array.from(
          new Set(progressRows.map((r) => r.competency_id))
        );
        const { data: comps, error: compsErr } = await supabase
          .from("competencies")
          .select("id, name, difficulty, tags, test_question, created_at")
          .in("id", ids);

        // If blocked by RLS or empty table, compsErr may be null but length 0
        let compMap = new Map<string, Competency>();
        if (compsErr) {
          // Could be RLS error; mark as not visible
          setCompetenciesVisible(false);
        } else {
          const list = (comps ?? []) as Competency[];
          setCompetenciesVisible(list.length > 0);
          compMap = new Map(list.map((c) => [c.id, c]));
        }

        // Merge with fallback when competency not visible
        const merged = progressRows.map((r) => {
          const c = compMap.get(r.competency_id);
          return {
            ...r,
            competency: c ?? {
              id: r.competency_id,
              name: null,
              difficulty: null,
              tags: null,
            },
          };
        });

        // Sort: incomplete first, then by (name || id)
        merged.sort((a, b) => {
          if (a.pct !== b.pct) return a.pct - b.pct;
          const an = a.competency.name ?? a.competency.id;
          const bn = b.competency.name ?? b.competency.id;
          return an.localeCompare(bn);
        });

        setRows(merged);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalAssigned = rows.length;
  const avgPct = useMemo(() => {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((acc, r) => acc + r.pct, 0);
    return Math.round(sum / rows.length);
  }, [rows]);

  return (
    <main
      style={{
        backgroundColor: THEME.CANVAS,
        color: THEME.TEXT,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${THEME.BORDER}` }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                height: 36,
                width: 36,
                borderRadius: 12,
                background: THEME.SURFACE,
                border: `1px solid ${THEME.BORDER}`,
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              TC
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>
                True Competency — Trainee
              </h1>
              <p style={{ fontSize: 12, color: THEME.MUTED }}>
                Your assigned topics & progress
              </p>
            </div>
          </div>
          <div style={{ fontSize: 13, color: THEME.MUTED }}>
            {email ?? "Not signed in"}
          </div>
        </div>
      </header>

      {/* Notices */}
      <section
        style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 24px" }}
      >
        {err && (
          <div
            style={{
              border: "1px solid #5c1d22",
              background: "#2a0f13",
              color: "#fecdd3",
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {err}
          </div>
        )}
        {competenciesVisible === false && (
          <div
            style={{
              border: `1px solid ${THEME.BORDER}`,
              background: THEME.SURFACE,
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 13,
              marginBottom: 12,
              color: THEME.MUTED,
            }}
          >
            Heads-up: <b style={{ color: THEME.TEXT }}>competencies</b> returned
            0 rows (empty or hidden by RLS). Showing progress using fallback
            IDs.
          </div>
        )}
      </section>

      {/* KPIs */}
      <section
        style={{ maxWidth: 1120, margin: "0 auto", padding: "8px 24px 28px" }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 14,
            color: THEME.MUTED,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span>
            Assigned topics:{" "}
            <span style={{ color: THEME.TEXT }}>{totalAssigned}</span>
          </span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>
            Average progress:{" "}
            <span style={{ color: THEME.TEXT }}>{avgPct}%</span>
          </span>
        </div>

        {loading && <div style={{ color: THEME.MUTED }}>Loading…</div>}

        {!loading && rows.length === 0 && !err && (
          <div style={{ color: THEME.MUTED }}>No assignments yet.</div>
        )}

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: 12,
          }}
        >
          {rows.map((r) => {
            const title =
              r.competency.name ?? `Topic ${r.competency.id.slice(0, 8)}…`;
            const diff = r.competency.difficulty ?? "—";

            return (
              <article
                key={r.competency_id}
                style={{
                  background: THEME.SURFACE,
                  border: `1px solid ${THEME.BORDER}`,
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <h3 style={{ fontWeight: 600, lineHeight: 1.2 }}>{title}</h3>
                  <span
                    style={{
                      background: THEME.ACCENT,
                      color: "#0a0a0a",
                      borderRadius: 999,
                      padding: "4px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {diff}
                  </span>
                </div>

                <div style={{ marginTop: 8, fontSize: 12, color: THEME.MUTED }}>
                  {r.answered_questions}/{r.total_questions} answered
                </div>

                <div
                  style={{
                    marginTop: 8,
                    height: 8,
                    width: "100%",
                    borderRadius: 999,
                    background: "#0c0d11",
                    outline: `1px solid ${THEME.BORDER}`,
                    overflow: "hidden",
                  }}
                  title={`${r.pct}%`}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${r.pct}%`,
                      background: THEME.ACCENT,
                      boxShadow: `0 0 0 1px ${THEME.ACCENT}20 inset`,
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Link
                    href={`/trainee/competency/${r.competency_id}`}
                    style={{
                      fontSize: 13,
                      color: THEME.TEXT,
                      textDecoration: "underline",
                      textUnderlineOffset: 4,
                      opacity: 0.9,
                    }}
                  >
                    Continue →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
