"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * --- THEME TOKENS ---
 * Replace these 5 HEX values to match your sign-in page exactly.
 * Example: set ACCENT to your brand primary.
 */
const THEME = {
  CANVAS: "#0b0c0f", // page background
  SURFACE: "#121418", // card background
  BORDER: "#1f232a", // subtle borders
  TEXT: "#e6e7ea", // main text
  MUTED: "#9aa0a6", // muted text
  ACCENT: "#6ae6b2", // brand accent (progress/focus/cta)
};

type Competency = {
  id: string;
  name: string;
  difficulty: string;
  tags: string[] | null;
  test_question: string | null;
  created_at: string;
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
  display_name: string | null;
  role: "student" | "doctor";
};

export default function StudentDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<
    Array<ProgressRow & { competency: Competency }>
  >([]);
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

        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("id, display_name, role")
          .eq("id", uid)
          .single<Profile>();
        if (profErr) throw profErr;
        if (cancelled) return;

        const { data: progress, error: progErr } = await supabase
          .from("student_competency_progress")
          .select(
            "student_id, competency_id, total_questions, answered_questions, pct"
          )
          .eq("student_id", prof.id);
        if (progErr) throw progErr;
        if (cancelled) return;

        const progressRows: ProgressRow[] = (progress ?? []) as ProgressRow[];
        const compIds = progressRows.map((r) => r.competency_id);
        if (compIds.length === 0) {
          setRows([]);
          return;
        }

        const { data: comps, error: compsErr } = await supabase
          .from("competencies")
          .select("id, name, difficulty, tags, test_question, created_at")
          .in("id", compIds);
        if (compsErr) throw compsErr;
        if (cancelled) return;

        const compList = (comps ?? []) as Competency[];
        const compMap = new Map<string, Competency>(
          compList.map((c) => [c.id, c])
        );

        const merged = progressRows
          .map((r) => {
            const c = compMap.get(r.competency_id);
            return c ? { ...r, competency: c } : null;
          })
          .filter(
            (x): x is ProgressRow & { competency: Competency } => x !== null
          );

        merged.sort((a, b) => {
          if (a.pct === b.pct)
            return a.competency.name.localeCompare(b.competency.name);
          return a.pct - b.pct;
        });

        setRows(merged);
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
                color: THEME.TEXT,
              }}
            >
              TC
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>
                True Competency — Student
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

      {/* Top KPIs */}
      <section
        style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 24px" }}
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

        {err && (
          <div
            style={{
              border: `1px solid rgba(244, 63, 94, .25)`,
              background: "rgba(244, 63, 94, .08)",
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

        {!loading && !err && rows.length === 0 && (
          <div style={{ color: THEME.MUTED }}>No assignments yet.</div>
        )}

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: 12,
            marginTop: 8,
            marginBottom: 28,
          }}
        >
          {rows.map((r) => (
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
                <h3 style={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {r.competency.name}
                </h3>
                <span
                  style={{
                    background: THEME.ACCENT,
                    color: "#0a0a0a",
                    borderRadius: 999,
                    padding: "4px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                  }}
                >
                  {r.competency.difficulty}
                </span>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: THEME.MUTED }}>
                {r.answered_questions}/{r.total_questions} answered
              </div>

              {/* Progress */}
              <div
                style={{
                  marginTop: 8,
                  height: 8,
                  width: "100%",
                  borderRadius: 999,
                  background: "#0c0d11",
                  outline: `1px solid ${THEME.BORDER}`,
                  overflow: "hidden",
                  position: "relative",
                }}
                title={`${r.pct}%`}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${r.pct}%`,
                    background: `linear-gradient(90deg, ${THEME.ACCENT} 0%, ${THEME.ACCENT} 60%, ${THEME.ACCENT} 100%)`,
                    boxShadow: `0 0 0 1px ${THEME.ACCENT}20 inset`,
                  }}
                />
              </div>

              {/* Tags */}
              {r.competency.tags && r.competency.tags.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {r.competency.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        border: `1px solid ${THEME.BORDER}`,
                        background: "#0e1014",
                        color: THEME.MUTED,
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <a
                  href={`/student/competency/${r.competency_id}`}
                  style={{
                    fontSize: 13,
                    color: THEME.TEXT,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    opacity: 0.9,
                  }}
                >
                  Continue →
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
