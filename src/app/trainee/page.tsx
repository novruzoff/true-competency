// src/app/trainee/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
  role: "trainee" | "instructor" | "committee" | "student" | "doctor";
};

export default function TraineeDashboard() {
  const router = useRouter();

  const [rows, setRows] = useState<
    Array<ProgressRow & { competency: Competency }>
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [competenciesVisible, setCompetenciesVisible] = useState<
    boolean | null
  >(null);

  // For the streak widget
  const [streakDays, setStreakDays] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      setCompetenciesVisible(null);

      try {
        // who am I
        const { data: userRes, error: getUserErr } =
          await supabase.auth.getUser();
        if (getUserErr) throw getUserErr;

        const uid = userRes.user?.id ?? null;
        if (!uid) {
          router.replace("/signin?redirect=/trainee");
          return;
        }

        // ensure profile exists & grab id
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", uid)
          .single<Profile>();
        if (profErr) throw profErr;
        if (cancelled) return;

        // progress rows (fast, single table)
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
          setCompetenciesVisible(true);
        } else {
          // fetch competency meta for visible cards
          const ids = Array.from(
            new Set(progressRows.map((r) => r.competency_id))
          );
          const { data: comps, error: compsErr } = await supabase
            .from("competencies")
            .select("id, name, difficulty, tags, test_question, created_at")
            .in("id", ids);

          let compMap = new Map<string, Competency>();
          if (compsErr) {
            setCompetenciesVisible(false);
          } else {
            const list = (comps ?? []) as Competency[];
            setCompetenciesVisible(list.length > 0);
            compMap = new Map(list.map((c) => [c.id, c]));
          }

          const merged = progressRows
            .map((r) => ({
              ...r,
              competency: compMap.get(r.competency_id) ?? {
                id: r.competency_id,
                name: null,
                difficulty: null,
                tags: null,
              },
            }))
            .sort((a, b) => {
              if (a.pct !== b.pct) return a.pct - b.pct;
              const an = a.competency.name ?? a.competency.id;
              const bn = b.competency.name ?? b.competency.id;
              return an.localeCompare(bn);
            });

          setRows(merged);
        }

        // Lightweight streak: last 30 days with answers → contiguous days up to today
        const { data: recent, error: ansErr } = await supabase
          .from("student_answers")
          .select("answered_at")
          .eq("student_id", prof.id)
          .gte(
            "answered_at",
            new Date(Date.now() - 31 * 86400000).toISOString()
          )
          .order("answered_at", { ascending: false })
          .limit(200);

        if (ansErr) {
          setStreakDays(0);
        } else {
          const days = new Set(
            (recent ?? []).map((r: { answered_at: string }) =>
              new Date(r.answered_at).toISOString().slice(0, 10)
            )
          );
          let streak = 0;
          const today = new Date();
          for (let i = 0; i < 31; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            if (days.has(key)) streak += 1;
            else break;
          }
          setStreakDays(streak);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // --- KPIs derived from current rows (no extra requests) ---
  const totalAssigned = rows.length;

  const totals = useMemo(() => {
    let answered = 0;
    let total = 0;
    rows.forEach((r) => {
      answered += r.answered_questions ?? 0;
      total += r.total_questions ?? 0;
    });
    return { answered, total };
  }, [rows]);

  const avgPct = useMemo(() => {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((acc, r) => acc + r.pct, 0);
    return Math.round(sum / rows.length);
  }, [rows]);

  const completedCount = useMemo(
    () => rows.filter((r) => (r.pct ?? 0) >= 100).length,
    [rows]
  );

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)] transition-colors">
      {/* Page intro */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Trainee dashboard
        </h1>
        <div className="accent-underline mt-3" />
        <p className="mt-3 text-sm md:text-base text-[var(--muted)] max-w-prose">
          Track your competency progress and continue where you left off.
        </p>
      </section>

      {/* KPI widgets */}
      <section className="mx-auto max-w-6xl px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardTitle>Total Assessments</CardTitle>
            <CardValue>{totals.answered}</CardValue>
            <CardSub>Answered questions (all time)</CardSub>
          </Card>

          <Card>
            <CardTitle>Competency Progress</CardTitle>
            <div className="mt-2 text-2xl font-semibold">
              {completedCount}/{totalAssigned}
            </div>
            <ProgressBar
              pct={
                totals.total
                  ? Math.round((totals.answered / totals.total) * 100)
                  : 0
              }
            />
            <CardSub className="mt-1">
              {totals.total
                ? Math.round((totals.answered / totals.total) * 100)
                : 0}
              % complete
            </CardSub>
          </Card>

          <Card>
            <CardTitle>Average Score</CardTitle>
            <CardValue>{avgPct}%</CardValue>
            <CardSub>Across assigned competencies</CardSub>
          </Card>

          <Card>
            <CardTitle>Current Streak</CardTitle>
            <CardValue>{streakDays}</CardValue>
            <CardSub>consecutive day{s(streakDays)}</CardSub>
          </Card>
        </div>
      </section>

      {/* Notices */}
      <section className="mx-auto max-w-6xl px-6">
        {err && (
          <div className="mb-4 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200 shadow">
            {err}
          </div>
        )}
        {competenciesVisible === false && (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
            Heads-up: <b className="text-[var(--foreground)]">competencies</b>{" "}
            returned 0 rows (empty or hidden by RLS).
          </div>
        )}
      </section>

      {/* Currently Learning */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <span className="i-lucide-radar" aria-hidden />
            Currently Learning
          </h2>
        </div>

        {loading && <div className="text-[var(--muted)]">Loading…</div>}
        {!loading && rows.length === 0 && !err && (
          <div className="text-[var(--muted)]">No assignments yet.</div>
        )}

        <div className="space-y-3">
          {rows.map((r) => {
            const title =
              r.competency.name ?? `Topic ${r.competency.id.slice(0, 8)}…`;
            const pct = Math.max(0, Math.min(100, Math.round(r.pct ?? 0)));
            const needed = Math.max(
              0,
              (r.total_questions ?? 0) - (r.answered_questions ?? 0)
            );
            const diffRaw = (r.competency.difficulty ?? "").trim();
            const diff = diffRaw.toLowerCase();

            // Map difficulty to status colors; ALWAYS black text for readability
            const badgeBg =
              diff === "beginner"
                ? "var(--ok)"
                : diff === "intermediate"
                ? "var(--warn)"
                : diff === "expert"
                ? "var(--err)"
                : "var(--border)";

            return (
              <article
                key={r.competency_id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Title & Difficulty */}
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold leading-tight truncate">
                        {title}
                      </h3>
                      {diff && (
                        <span
                          className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                          style={{ background: badgeBg, color: "#000" }}
                        >
                          {diffRaw}
                        </span>
                      )}
                    </div>

                    {/* Progress row */}
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-[var(--muted)]">Progress</span>
                      <span className="text-[var(--foreground)]">
                        {r.answered_questions}/{r.total_questions} cases ({pct}
                        %)
                      </span>
                    </div>

                    <div className="mt-1 h-[6px] w-full overflow-hidden rounded-full bg-[var(--field)] border border-[var(--border)]">
                      <div
                        className="h-full"
                        style={{
                          width: `${pct}%`,
                          background: "var(--accent)",
                          boxShadow:
                            "0 0 0 1px color-mix(in oklab, var(--accent) 20%, transparent) inset",
                        }}
                      />
                    </div>

                    {/* Needed line */}
                    <div className="mt-2 text-xs text-[var(--muted)]">
                      {needed > 0 ? (
                        <span>
                          {needed} more case{needed === 1 ? "" : "s"} needed
                        </span>
                      ) : (
                        <span>Ready for review</span>
                      )}
                    </div>

                    {/* Tags */}
                    {!!r.competency.tags?.length && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.competency.tags!.slice(0, 6).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chevron action */}
                  <Link
                    href={`/trainee/competency/${r.competency_id}`}
                    className="shrink-0 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--field)] hover:bg-[var(--surface)]"
                    title="Open"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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

/* ---------- tiny presentational helpers ---------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      {children}
    </div>
  );
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-[var(--muted)]">{children}</div>;
}
function CardValue({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-3xl font-semibold">{children}</div>;
}
function CardSub({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-xs text-[var(--muted)] ${className}`}>{children}</div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--field)]">
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          background: "var(--accent)",
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--accent) 20%, transparent) inset",
        }}
      />
    </div>
  );
}

function s(n: number) {
  return n === 1 ? "" : "s";
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[var(--foreground)]/80">
      {children}
    </span>
  );
}
