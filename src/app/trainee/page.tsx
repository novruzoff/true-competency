// src/app/trainee/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ChevronAction } from "@/components/ui/ChevronAction";

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

type AnswerRow = { question_id: string; answered_at: string };
type QuestionRow = { id: string; competency_id: string };

export default function TraineeDashboard() {
  const router = useRouter();

  const [rows, setRows] = useState<
    Array<
      ProgressRow & { competency: Competency; last_answered_at?: string | null }
    >
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [competenciesVisible, setCompetenciesVisible] = useState<
    boolean | null
  >(null);

  // For widgets
  const [streakDays, setStreakDays] = useState<number>(0);

  // Not-started difficulty filter
  const [notStartedFilter, setNotStartedFilter] = useState<
    "all" | "beginner" | "intermediate" | "expert"
  >("all");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      setCompetenciesVisible(null);

      try {
        const { data: userRes, error: getUserErr } =
          await supabase.auth.getUser();
        if (getUserErr) throw getUserErr;

        const uid = userRes.user?.id ?? null;
        if (!uid) {
          router.replace("/signin?redirect=/trainee");
          return;
        }

        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("id, role")
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

        if (progressRows.length === 0) {
          setRows([]);
          setCompetenciesVisible(true);
        } else {
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

          // recent answers → last activity per competency
          const { data: recentAns } = await supabase
            .from("student_answers")
            .select("question_id, answered_at")
            .eq("student_id", prof.id)
            .order("answered_at", { ascending: false })
            .limit(500)
            .returns<AnswerRow[]>();

          const lastByCompetency = new Map<string, string>();
          if (recentAns && recentAns.length) {
            const qids = Array.from(
              new Set(recentAns.map((a) => a.question_id))
            );
            const { data: qMeta } = await supabase
              .from("competency_questions")
              .select("id, competency_id")
              .in("id", qids)
              .returns<QuestionRow[]>();

            const qToComp = new Map<string, string>();
            (qMeta ?? []).forEach((q) => qToComp.set(q.id, q.competency_id));

            for (const a of recentAns) {
              const cid = qToComp.get(a.question_id);
              if (!cid) continue;
              const prev = lastByCompetency.get(cid);
              if (!prev || new Date(a.answered_at) > new Date(prev)) {
                lastByCompetency.set(cid, a.answered_at);
              }
            }
          }

          const merged = progressRows.map((r) => ({
            ...r,
            competency: compMap.get(r.competency_id) ?? {
              id: r.competency_id,
              name: null,
              difficulty: null,
              tags: null,
            },
            last_answered_at: lastByCompetency.get(r.competency_id) ?? null,
          }));

          setRows(merged);
        }

        // Streak: last 30 days
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

  // --- KPIs derived from current rows ---
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

  // --- Active vs Not Started ---
  const activeRows = useMemo(() => {
    return rows
      .filter((r) => (r.answered_questions ?? 0) > 0)
      .slice()
      .sort((a, b) => {
        const at = a.last_answered_at
          ? new Date(a.last_answered_at).getTime()
          : 0;
        const bt = b.last_answered_at
          ? new Date(b.last_answered_at).getTime()
          : 0;
        if (bt !== at) return bt - at;
        const an = (a.competency.name ?? a.competency.id).toLowerCase();
        const bn = (b.competency.name ?? b.competency.id).toLowerCase();
        return an.localeCompare(bn);
      });
  }, [rows]);

  const notStartedRows = useMemo(() => {
    let list = rows.filter((r) => (r.answered_questions ?? 0) === 0);
    if (notStartedFilter !== "all") {
      list = list.filter(
        (r) =>
          (r.competency.difficulty ?? "").toLowerCase() === notStartedFilter
      );
    }
    return list.slice().sort((a, b) => {
      const an = (a.competency.name ?? a.competency.id).toLowerCase();
      const bn = (b.competency.name ?? b.competency.id).toLowerCase();
      return an.localeCompare(bn);
    });
  }, [rows, notStartedFilter]);

  // UI helpers
  const badgeBg = (diff: string | null | undefined) => {
    const k = (diff ?? "").toLowerCase();
    if (k === "beginner") return "var(--ok)";
    if (k === "intermediate") return "var(--warn)";
    if (k === "expert") return "var(--err)";
    return "var(--border)";
  };

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

      {/* ACTIVE (recently worked) */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            Active — Recently worked
          </h2>
        </div>

        {loading && <div className="text-[var(--muted)]">Loading…</div>}
        {!loading && activeRows.length === 0 && !err && (
          <div className="text-[var(--muted)]">No active topics yet.</div>
        )}

        <div className="space-y-3">
          {activeRows.map((r) => {
            const title =
              r.competency.name ?? `Topic ${r.competency.id.slice(0, 8)}…`;
            const pct = Math.max(0, Math.min(100, Math.round(r.pct ?? 0)));
            const needed = Math.max(
              0,
              (r.total_questions ?? 0) - (r.answered_questions ?? 0)
            );
            const diffRaw = (r.competency.difficulty ?? "").trim();
            const diff = diffRaw.toLowerCase();

            return (
              <article
                key={r.competency_id}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Title row padded so it never runs beneath chevron */}
                    <div className="flex items-center gap-2 pe-12 md:pe-14">
                      <h3 className="font-semibold leading-tight truncate">
                        {title}
                      </h3>
                      {diff && (
                        <span
                          className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                          style={{ background: badgeBg(diff), color: "#000" }}
                        >
                          {diffRaw}
                        </span>
                      )}
                    </div>

                    {/* meta row */}
                    <div className="mt-2 text-xs text-[var(--muted)]">
                      {r.last_answered_at
                        ? `Last worked: ${new Date(
                            r.last_answered_at
                          ).toLocaleString()}`
                        : "Recently started"}
                    </div>

                    {/* progress */}
                    <div className="mt-2 flex items-center justify-between text-xs">
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

                    <div className="mt-2 text-xs text-[var(--muted)]">
                      {needed > 0 ? (
                        <span>
                          {needed} more case{needed === 1 ? "" : "s"} needed
                        </span>
                      ) : (
                        <span>Ready for review</span>
                      )}
                    </div>

                    {!!r.competency.tags?.length && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.competency.tags!.slice(0, 6).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* open */}
                  <ChevronAction
                    href={`/trainee/competency/${r.competency_id}`}
                    variant="accent"
                    className="absolute top-3 right-3"
                    title="Open"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* NOT STARTED */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">Not Started</h2>

          {/* Difficulty filter */}
          <div className="flex items-center gap-2 text-xs">
            <FilterChip
              label="All"
              active={notStartedFilter === "all"}
              onClick={() => setNotStartedFilter("all")}
            />
            <FilterChip
              label="Beginner"
              color="var(--ok)"
              active={notStartedFilter === "beginner"}
              onClick={() => setNotStartedFilter("beginner")}
            />
            <FilterChip
              label="Intermediate"
              color="var(--warn)"
              active={notStartedFilter === "intermediate"}
              onClick={() => setNotStartedFilter("intermediate")}
            />
            <FilterChip
              label="Expert"
              color="var(--err)"
              active={notStartedFilter === "expert"}
              onClick={() => setNotStartedFilter("expert")}
            />
          </div>
        </div>

        {!loading && notStartedRows.length === 0 && !err && (
          <div className="text-[var(--muted)] text-sm">
            No items match this filter.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {notStartedRows.map((r) => {
            const title =
              r.competency.name ?? `Topic ${r.competency.id.slice(0, 8)}…`;
            const diffRaw = (r.competency.difficulty ?? "").trim();
            const diff = diffRaw.toLowerCase();

            return (
              <article
                key={`ns_${r.competency_id}`}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {/* Title row padded so it never runs beneath chevron */}
                    <div className="pe-12 md:pe-14">
                      <h3 className="font-semibold leading-tight truncate">
                        {title}
                      </h3>
                    </div>
                    {diff && (
                      <span
                        className="mt-1 inline-block text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{ background: badgeBg(diff), color: "#000" }}
                      >
                        {diffRaw}
                      </span>
                    )}
                    {!!r.competency.tags?.length && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.competency.tags!.slice(0, 6).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronAction
                    href={`/trainee/competency/${r.competency_id}`}
                    variant="neutral"
                    className="absolute top-3 right-3"
                    title="Start"
                  />
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

function FilterChip({
  label,
  onClick,
  active,
  color,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full border text-xs font-medium transition",
        active
          ? "shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_18%,transparent)]"
          : "",
      ].join(" ")}
      style={{
        borderColor: "var(--border)",
        background: active ? color ?? "var(--field)" : "var(--surface)",
        color: active ? "#000" : "var(--foreground)",
      }}
    >
      {label}
    </button>
  );
}
