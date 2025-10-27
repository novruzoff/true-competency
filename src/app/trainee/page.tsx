// src/app/trainee/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ChevronAction } from "@/components/ui/ChevronAction";

/* ---------- types ---------- */
type Role = "trainee" | "instructor" | "committee" | "student" | "doctor";

type Profile = {
  id: string;
  role: Role;
  first_name: string | null;
  last_name: string | null;
  full_name?: string | null;
  email?: string | null;
};

type Competency = {
  id: string;
  name: string | null;
  difficulty: string | null; // beginner | intermediate | expert
  tags: string[] | null;
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

type Assignment = {
  student_id: string;
  competency_id: string;
  assigned_at?: string;
};

/* ---------- constants ---------- */
const DIFF_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  expert: 2,
};

/* ---------- page ---------- */
export default function TraineeDashboard() {
  const router = useRouter();

  // auth/profile
  const [me, setMe] = useState<Profile | null>(null);
  const [greetingName, setGreetingName] = useState<string>("");

  // data
  const [allComps, setAllComps] = useState<Competency[]>([]);
  const [assignments, setAssignments] = useState<Set<string>>(new Set()); // enrolled ids
  const [progressByComp, setProgressByComp] = useState<
    Map<string, ProgressRow>
  >(new Map());

  // ui
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [diffFilter, setDiffFilter] = useState<
    "all" | "beginner" | "intermediate" | "expert"
  >("all");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchQ, setSearchQ] = useState("");

  // widgets
  const [streakDays, setStreakDays] = useState(0);

  /* ---------- load ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        // session
        const { data: userRes, error: getUserErr } =
          await supabase.auth.getUser();
        if (getUserErr) throw getUserErr;
        const uid = userRes.user?.id ?? null;
        if (!uid) {
          router.replace("/signin?redirect=/trainee");
          return;
        }

        // profile (for greeting + id)
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("id, role, first_name, last_name, full_name, email")
          .eq("id", uid)
          .single<Profile>();
        if (profErr) throw profErr;
        if (cancelled) return;

        setMe(prof);
        const name = (
          prof.full_name || `${prof.first_name ?? ""} ${prof.last_name ?? ""}`
        ).trim();
        setGreetingName(name || prof.email || "there");

        // all competencies
        const { data: comps, error: compsErr } = await supabase
          .from("competencies")
          .select("id, name, difficulty, tags, test_question, created_at")
          .returns<Competency[]>();
        if (compsErr) throw compsErr;
        if (cancelled) return;

        // sort: difficulty then name
        const sorted = (comps ?? []).slice().sort((a, b) => {
          const da = DIFF_ORDER[(a.difficulty ?? "").toLowerCase()] ?? 99;
          const db = DIFF_ORDER[(b.difficulty ?? "").toLowerCase()] ?? 99;
          if (da !== db) return da - db;
          const an = (a.name ?? "").toLowerCase();
          const bn = (b.name ?? "").toLowerCase();
          return an.localeCompare(bn);
        });
        setAllComps(sorted);

        // my assignments (enrolled competencies)
        const { data: assigns, error: aErr } = await supabase
          .from("competency_assignments")
          .select("competency_id")
          .eq("student_id", prof.id)
          .returns<Assignment[]>();
        if (aErr) throw aErr;

        const enrolled = new Set<string>(
          (assigns ?? []).map((r) => r.competency_id)
        );
        setAssignments(enrolled);

        // my progress
        const { data: progress, error: pErr } = await supabase
          .from("student_competency_progress")
          .select(
            "student_id, competency_id, total_questions, answered_questions, pct"
          )
          .eq("student_id", prof.id)
          .returns<ProgressRow[]>();
        if (pErr) throw pErr;

        const pMap = new Map<string, ProgressRow>();
        (progress ?? []).forEach((r) => pMap.set(r.competency_id, r));
        setProgressByComp(pMap);

        // streak — last 30 days with answers
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

  /* ---------- enroll ---------- */
  const enroll = useCallback(
    async (competencyId: string) => {
      if (!me) return;
      const now = new Date().toISOString();
      // optimistic
      setAssignments((prev) => new Set(prev).add(competencyId));

      const { error } = await supabase.from("competency_assignments").upsert(
        [
          {
            student_id: me.id,
            competency_id: competencyId,
            assigned_at: now,
          },
        ],
        { onConflict: "student_id,competency_id" }
      );
      if (error) {
        // rollback
        setAssignments((prev) => {
          const next = new Set(prev);
          next.delete(competencyId);
          return next;
        });
        setErr(error.message);
      }
    },
    [me]
  );

  /* ---------- derive filters & splits ---------- */
  const allTags = useMemo(() => {
    const bag = new Set<string>();
    allComps.forEach((c) => (c.tags ?? []).forEach((t) => bag.add(t)));
    return Array.from(bag).sort((a, b) => a.localeCompare(b));
  }, [allComps]);

  const filtered = useMemo(() => {
    let list = allComps;

    if (diffFilter !== "all") {
      list = list.filter(
        (c) => (c.difficulty ?? "").toLowerCase() === diffFilter
      );
    }

    if (selectedTags.size > 0) {
      list = list.filter((c) => {
        const tags = new Set(c.tags ?? []);
        for (const t of selectedTags) {
          if (!tags.has(t)) return false;
        }
        return true;
      });
    }

    const q = searchQ.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const hay =
          (c.name ?? "") +
          " " +
          (c.difficulty ?? "") +
          " " +
          (c.tags ?? []).join(" ");
        return hay.toLowerCase().includes(q);
      });
    }

    return list;
  }, [allComps, diffFilter, selectedTags, searchQ]);

  const enrolledList = useMemo(
    () => filtered.filter((c) => assignments.has(c.id)),
    [filtered, assignments]
  );

  const availableList = useMemo(
    () => filtered.filter((c) => !assignments.has(c.id)),
    [filtered, assignments]
  );

  /* ---------- KPIs from assignments + progress ---------- */
  const enrolledIds = useMemo(() => Array.from(assignments), [assignments]);
  const totalAssigned = enrolledIds.length;

  const totals = useMemo(() => {
    let answered = 0;
    let total = 0;
    enrolledIds.forEach((cid) => {
      const r = progressByComp.get(cid);
      if (r) {
        answered += r.answered_questions ?? 0;
        total += r.total_questions ?? 0;
      }
    });
    return { answered, total };
  }, [enrolledIds, progressByComp]);

  const avgPct = useMemo(() => {
    if (totalAssigned === 0) return 0;
    const sum = enrolledIds.reduce(
      (acc, cid) => acc + (progressByComp.get(cid)?.pct ?? 0),
      0
    );
    return Math.round(sum / totalAssigned);
  }, [enrolledIds, progressByComp, totalAssigned]);

  const completedCount = useMemo(
    () =>
      enrolledIds.filter((cid) => (progressByComp.get(cid)?.pct ?? 0) >= 100)
        .length,
    [enrolledIds, progressByComp]
  );

  const progressBuckets = useMemo(() => {
    let notStarted = 0,
      active = 0,
      done = 0;
    enrolledIds.forEach((cid) => {
      const p = progressByComp.get(cid)?.pct ?? 0;
      if (p >= 100) done++;
      else if (p > 0) active++;
      else notStarted++;
    });
    return { notStarted, active, done };
  }, [enrolledIds, progressByComp]);

  const difficultyBreakdown = useMemo(() => {
    const counts = { beginner: 0, intermediate: 0, expert: 0, other: 0 };
    enrolledIds.forEach((cid) => {
      const c = allComps.find((x) => x.id === cid);
      const k = (c?.difficulty ?? "").toLowerCase();
      if (k === "beginner") counts.beginner++;
      else if (k === "intermediate") counts.intermediate++;
      else if (k === "expert") counts.expert++;
      else counts.other++;
    });
    return counts;
  }, [enrolledIds, allComps]);

  /* ---------- helpers ---------- */
  const badgeBg = (diff?: string | null) => {
    const k = (diff ?? "").toLowerCase();
    if (k === "beginner") return "var(--ok)";
    if (k === "intermediate") return "var(--warn)";
    if (k === "expert") return "var(--err)";
    return "var(--border)";
  };

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const clearFilters = () => {
    setDiffFilter("all");
    setSelectedTags(new Set());
    setSearchQ("");
  };

  /* ---------- render ---------- */
  return (
    <main className="bg-[var(--background)] text-[var(--foreground)] transition-colors">
      {/* Intro */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          {greetingName ? `Welcome back, ${greetingName}` : "Welcome back"}
        </h1>
        <div className="accent-underline mt-3" />
        <p className="mt-3 text-sm md:text-base text-[var(--muted)] max-w-prose">
          Explore competencies, enroll in topics you want to master, and track
          your progress.
        </p>
      </section>

      {/* KPI + Charts */}
      <section className="mx-auto max-w-6xl px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4">
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
              <CardSub>Across enrolled competencies</CardSub>
            </Card>
            <Card>
              <CardTitle>Current Streak</CardTitle>
              <CardValue>{streakDays}</CardValue>
              <CardSub>consecutive day{s(streakDays)}</CardSub>
            </Card>
          </div>

          <Card>
            <CardTitle>Enrolled by difficulty</CardTitle>
            <DonutByDifficulty counts={difficultyBreakdown} />
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <LegendDot
                label="Beginner"
                color="var(--ok)"
                value={difficultyBreakdown.beginner}
              />
              <LegendDot
                label="Intermediate"
                color="var(--warn)"
                value={difficultyBreakdown.intermediate}
              />
              <LegendDot
                label="Expert"
                color="var(--err)"
                value={difficultyBreakdown.expert}
              />
              <LegendDot
                label="Other"
                color="var(--border)"
                value={difficultyBreakdown.other}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>Progress overview</CardTitle>
            <StackedProgressBuckets
              buckets={progressBuckets}
              total={totalAssigned}
            />
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <LegendDot
                label="Not started"
                color="var(--border)"
                value={progressBuckets.notStarted}
              />
              <LegendDot
                label="Active"
                color="var(--accent)"
                value={progressBuckets.active}
              />
              <LegendDot
                label="Completed"
                color="var(--ok)"
                value={progressBuckets.done}
              />
            </div>
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
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-6xl px-6 pb-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-xs">
              <FilterChip
                label="All"
                active={diffFilter === "all"}
                onClick={() => setDiffFilter("all")}
              />
              <FilterChip
                label="Beginner"
                color="var(--ok)"
                active={diffFilter === "beginner"}
                onClick={() => setDiffFilter("beginner")}
              />
              <FilterChip
                label="Intermediate"
                color="var(--warn)"
                active={diffFilter === "intermediate"}
                onClick={() => setDiffFilter("intermediate")}
              />
              <FilterChip
                label="Expert"
                color="var(--err)"
                active={diffFilter === "expert"}
                onClick={() => setDiffFilter("expert")}
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--field)] w-full lg:w-80">
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search by name or tag…"
                  className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:[color:var(--muted)]"
                />
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm hover:bg-[var(--surface)] transition hover:scale-[1.02] active:scale-[0.99]"
                title="Clear all filters"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* tag multi-select */}
          <div className="flex flex-wrap gap-1">
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={[
                  "text-[10px] rounded-full border px-2 py-0.5 transition",
                  selectedTags.has(t)
                    ? "bg-[var(--accent)] text-white border-transparent"
                    : "bg-[var(--surface)] text-[var(--foreground)]/80 border-[var(--border)] hover:bg-[var(--field)]",
                ].join(" ")}
                title={t}
              >
                {t}
              </button>
            ))}
            {allTags.length === 0 && (
              <span className="text-xs text-[var(--muted)]">
                No tags available.
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Currently Enrolled */}
      <section className="mx-auto max-w-6xl px-6 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">
            Currently Enrolled
          </h2>
          <div className="text-xs text-[var(--muted)]">
            {enrolledList.length} shown
          </div>
        </div>

        {loading && <div className="text-[var(--muted)]">Loading…</div>}
        {!loading && enrolledList.length === 0 && (
          <div className="text-[var(--muted)] text-sm">
            You’re not enrolled in any competencies matching these filters.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {enrolledList.map((c) => {
            const title = c.name ?? `Topic ${c.id.slice(0, 8)}…`;
            const diffRaw = (c.difficulty ?? "").trim();
            const p = progressByComp.get(c.id);
            const pct = Math.max(0, Math.min(100, Math.round(p?.pct ?? 0)));

            return (
              <article
                key={`enr_${c.id}`}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm min-h-[160px]"
              >
                <div className="flex items-start gap-2">
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    {diffRaw && (
                      <span
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{
                          background: badgeBg(diffRaw),
                          color: "#000",
                        }}
                      >
                        {diffRaw}
                      </span>
                    )}
                    <ChevronAction
                      href={`/trainee/competency/${c.id}`}
                      variant="accent"
                      title="Open"
                    />
                  </div>
                  <div className="min-w-0 flex-1 pe-28 md:pe-32">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold leading-snug break-words">
                        {title}
                      </h3>
                    </div>

                    {!!c.tags?.length && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.tags!.slice(0, 6).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-[var(--muted)]">Progress</span>
                      <span className="text-[var(--foreground)]">
                        {p?.answered_questions ?? 0}/{p?.total_questions ?? 0}{" "}
                        cases ({pct}%)
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
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Available Competencies */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">
            Available Competencies
          </h2>
          <div className="text-xs text-[var(--muted)]">
            {availableList.length} shown
          </div>
        </div>

        {!loading && availableList.length === 0 && (
          <div className="text-[var(--muted)] text-sm">
            No available competencies match your filters.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableList.map((c) => {
            const title = c.name ?? `Topic ${c.id.slice(0, 8)}…`;
            const diffRaw = (c.difficulty ?? "").trim();

            return (
              <article
                key={`avail_${c.id}`}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm min-h-[160px]"
              >
                <div className="flex items-start gap-2">
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    {diffRaw && (
                      <span
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{
                          background: badgeBg(diffRaw),
                          color: "#000",
                        }}
                      >
                        {diffRaw}
                      </span>
                    )}
                    <button
                      onClick={() => enroll(c.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-colors"
                      style={{
                        background: "#fff",
                        color: "var(--accent)",
                        borderColor: "var(--accent)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget.style.background = "var(--accent)"),
                          (e.currentTarget.style.color = "#fff");
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget.style.background = "#fff"),
                          (e.currentTarget.style.color = "var(--accent)");
                      }}
                      title="Enroll"
                    >
                      +
                    </button>
                  </div>
                  <div className="min-w-0 flex-1 pe-28 md:pe-32">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold leading-snug break-words">
                        {title}
                      </h3>
                    </div>

                    {!!c.tags?.length && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.tags!.slice(0, 6).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

/* ---------- charts ---------- */

function DonutByDifficulty({
  counts,
}: {
  counts: {
    beginner: number;
    intermediate: number;
    expert: number;
    other: number;
  };
}) {
  const size = 160;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = Math.PI * 2 * r;

  const vals = [
    { v: counts.beginner, color: "var(--ok)" },
    { v: counts.intermediate, color: "var(--warn)" },
    { v: counts.expert, color: "var(--err)" },
    { v: counts.other, color: "var(--border)" },
  ];
  const total = vals.reduce((s, x) => s + x.v, 0) || 1;

  let offset = 0;
  return (
    <div className="mt-2 flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {vals.map((seg, i) => {
            const frac = seg.v / total;
            const len = frac * c;
            const dash = `${len} ${c - len}`;
            const circle = (
              <circle
                key={i}
                r={r}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform="rotate(-90)"
              />
            );
            offset += len;
            return circle;
          })}
          <circle r={r - stroke / 2.2} fill="var(--surface)" />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill="var(--foreground)"
          >
            {total} total
          </text>
        </g>
      </svg>
    </div>
  );
}

function StackedProgressBuckets({
  buckets,
  total,
}: {
  buckets: { notStarted: number; active: number; done: number };
  total: number;
}) {
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const a = pct(buckets.notStarted);
  const b = pct(buckets.active);
  const d = pct(buckets.done);

  return (
    <div className="mt-3">
      <div className="h-3 w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--field)]">
        <div
          className="h-full"
          style={{ width: `${a}%`, background: "var(--border)" }}
          title={`Not started: ${buckets.notStarted}`}
        />
        <div
          className="h-full"
          style={{ width: `${b}%`, background: "var(--accent)" }}
          title={`Active: ${buckets.active}`}
        />
        <div
          className="h-full"
          style={{ width: `${d}%`, background: "var(--ok)" }}
          title={`Completed: ${buckets.done}`}
        />
      </div>
      <div className="mt-2 text-xs text-[var(--muted)]">
        {total} enrolled competencies
      </div>
    </div>
  );
}

function LegendDot({
  label,
  color,
  value,
}: {
  label: string;
  color: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border"
        style={{ background: color, borderColor: "var(--border)" }}
      />
      <span className="truncate">
        {label} — <span className="text-[var(--foreground)]">{value}</span>
      </span>
    </div>
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
