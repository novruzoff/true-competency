// src/app/instructor/page.client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ---------------- Types ---------------- */
type TraineeProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
};

type MeProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
};

type ProgressRow = { student_id: string; pct: number };
type AssignRow = { student_id: string; competency_id: string };

type StudentRow = {
  id: string;
  name: string;
  email: string;
  avgPct: number;
  assessments: number;
  lastAnsweredAt: string | null;
  assignedCount: number;
  completedCount: number;
};

type Competency = {
  id: string;
  name: string | null;
  difficulty: string | null; // beginner | intermediate | expert
  tags: string[] | null;
};

const DIFF_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  expert: 2,
};

/* ---------------- Page ---------------- */
export default function InstructorClient() {
  const router = useRouter();

  /* --- State --- */
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [greeting, setGreeting] = useState<string>("");

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentsQ, setStudentsQ] = useState("");

  // Competencies (read-only modal)
  const [compsOpen, setCompsOpen] = useState(false);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [compsLoading, setCompsLoading] = useState(false);
  const [compsErr, setCompsErr] = useState<string | null>(null);

  // Modal filters
  const [compsQ, setCompsQ] = useState("");
  const [compDiff, setCompDiff] = useState<
    "all" | "beginner" | "intermediate" | "expert"
  >("all");
  const [compTags, setCompTags] = useState<Set<string>>(new Set());

  // KPI widgets
  const [kpiActiveTrainees, setKpiActiveTrainees] = useState(0);
  const [kpiPendingAssessments, setKpiPendingAssessments] = useState(0);
  const [kpiAvgProgramScore, setKpiAvgProgramScore] = useState(0);
  const [kpiThisMonthAssessments, setKpiThisMonthAssessments] = useState(0);

  /* --- Load main data (greeting + trainees + KPIs) --- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr(null);
        setLoading(true);

        // Me (greeting)
        const { data: userRes, error: getUserErr } =
          await supabase.auth.getUser();
        if (getUserErr) throw getUserErr;
        const uid = userRes.user?.id ?? null;
        if (!uid) {
          router.replace("/signin?redirect=/instructor");
          return;
        }
        const { data: me, error: meErr } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, role")
          .eq("id", uid)
          .single<MeProfile>();
        if (meErr) throw meErr;

        const drName =
          (me?.last_name
            ? `Dr. ${me.last_name}`
            : me?.first_name
            ? `Dr. ${me.first_name}`
            : "") || "";
        if (!cancelled) setGreeting(drName);

        // Trainees
        const { data: pRows, error: pErr } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, role")
          .eq("role", "trainee")
          .returns<TraineeProfile[]>();
        if (pErr) throw pErr;

        const traineeIds = (pRows ?? []).map((p) => p.id);
        const nameFor = (t: TraineeProfile) =>
          [t.first_name ?? "", t.last_name ?? ""].join(" ").trim() ||
          "Unnamed trainee";

        const baseStudents: StudentRow[] = (pRows ?? []).map((t) => ({
          id: t.id,
          name: nameFor(t),
          email: t.email ?? "",
          avgPct: 0,
          assessments: 0,
          lastAnsweredAt: null,
          assignedCount: 0,
          completedCount: 0,
        }));

        // Progress aggregates
        const avgById = new Map<string, { sum: number; count: number }>();
        const completedById = new Map<string, number>();

        if (traineeIds.length > 0) {
          const { data: progress, error: prErr } = await supabase
            .from("student_competency_progress")
            .select("student_id, pct")
            .in("student_id", traineeIds)
            .returns<ProgressRow[]>();
          if (prErr) throw prErr;

          (progress ?? []).forEach((r) => {
            const cur = avgById.get(r.student_id) ?? { sum: 0, count: 0 };
            cur.sum += r.pct;
            cur.count += 1;
            avgById.set(r.student_id, cur);
            if (r.pct >= 100) {
              completedById.set(
                r.student_id,
                (completedById.get(r.student_id) ?? 0) + 1
              );
            }
          });
        }

        // Assignments (counts)
        const assignedById = new Map<string, number>();
        if (traineeIds.length > 0) {
          const { data: assigns, error: aErr } = await supabase
            .from("competency_assignments")
            .select("student_id, competency_id")
            .in("student_id", traineeIds)
            .returns<AssignRow[]>();
          if (aErr) throw aErr;

          (assigns ?? []).forEach((r) => {
            assignedById.set(
              r.student_id,
              (assignedById.get(r.student_id) ?? 0) + 1
            );
          });
        }

        // Answers (assessments + last date)
        const answersById = new Map<
          string,
          { count: number; last: string | null }
        >();
        if (traineeIds.length > 0) {
          const { data: answers, error: ansErr } = await supabase
            .from("student_answers")
            .select("student_id, answered_at")
            .in("student_id", traineeIds)
            .order("answered_at", { ascending: false });
          if (ansErr) throw ansErr;

          for (const row of answers ?? []) {
            const key = row.student_id as string;
            const cur = answersById.get(key) ?? { count: 0, last: null };
            cur.count += 1;
            if (!cur.last) cur.last = row.answered_at as string;
            answersById.set(key, cur);
          }
        }

        // Merge rows
        const merged: StudentRow[] = baseStudents.map((s) => {
          const agg = avgById.get(s.id);
          const avgPct =
            agg && agg.count > 0 ? Math.round(agg.sum / agg.count) : 0;

          const a = answersById.get(s.id);
          const assigned = assignedById.get(s.id) ?? 0;
          const completed = completedById.get(s.id) ?? 0;

          return {
            ...s,
            avgPct,
            assessments: a?.count ?? 0,
            lastAnsweredAt: a?.last ?? null,
            assignedCount: assigned,
            completedCount: completed,
          };
        });

        merged.sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setStudents(merged);

        // KPIs
        if (!cancelled) {
          setKpiActiveTrainees(merged.length);

          const monthStart = new Date();
          monthStart.setDate(1);

          const { count: pendingCount } = await supabase
            .from("student_answers")
            .select("question_id", { head: true, count: "exact" })
            .is("is_correct", null);
          setKpiPendingAssessments(pendingCount ?? 0);

          const avgProg =
            merged.length > 0
              ? Math.round(
                  merged.reduce((s, r) => s + (r.avgPct || 0), 0) /
                    merged.length
                )
              : 0;
          setKpiAvgProgramScore(avgProg);

          const { count: monthCount } = await supabase
            .from("student_answers")
            .select("question_id", { head: true, count: "exact" })
            .gte("answered_at", monthStart.toISOString());
          setKpiThisMonthAssessments(monthCount ?? 0);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* --- Fetch competencies whenever modal opens (always, not just first time) --- */
  useEffect(() => {
    if (!compsOpen) return;
    let cancelled = false;

    (async () => {
      try {
        setCompsErr(null);
        setCompsLoading(true);

        const { data: comps, error: cErr } = await supabase
          .from("competencies")
          .select("id, name, difficulty, tags")
          .returns<Competency[]>();
        if (cErr) throw cErr;

        const sorted = (comps ?? []).slice().sort((a, b) => {
          const da = DIFF_ORDER[(a.difficulty ?? "").toLowerCase()] ?? 99;
          const db = DIFF_ORDER[(b.difficulty ?? "").toLowerCase()] ?? 99;
          if (da !== db) return da - db;
          const an = (a.name ?? "").toLowerCase();
          const bn = (b.name ?? "").toLowerCase();
          return an.localeCompare(bn);
        });

        if (!cancelled) {
          setCompetencies(sorted);
          // reset filters each time you open
          setCompDiff("all");
          setCompTags(new Set());
          setCompsQ("");
        }
      } catch (e) {
        if (!cancelled)
          setCompsErr(
            e instanceof Error ? e.message : "Failed to load competencies."
          );
      } finally {
        if (!cancelled) setCompsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [compsOpen]);

  /* --- Derived filters --- */
  const filteredStudents = useMemo(() => {
    const q = studentsQ.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [studentsQ, students]);

  const allCompTags = useMemo(() => {
    const bag = new Set<string>();
    (competencies ?? []).forEach((c) =>
      (c.tags ?? []).forEach((t) => bag.add(t))
    );
    return Array.from(bag).sort((a, b) => a.localeCompare(b));
  }, [competencies]);

  const filteredComps = useMemo(() => {
    let list = competencies;

    if (compDiff !== "all") {
      list = list.filter(
        (c) => (c.difficulty ?? "").toLowerCase() === compDiff
      );
    }

    if (compTags.size > 0) {
      list = list.filter((c) => {
        const set = new Set(c.tags ?? []);
        for (const t of compTags) if (!set.has(t)) return false;
        return true;
      });
    }

    const q = compsQ.trim().toLowerCase();
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
  }, [competencies, compDiff, compTags, compsQ]);

  /* --- UI helpers --- */
  const badgeForDiff = (d: string | null) => {
    const k = (d ?? "").toLowerCase();
    if (k === "beginner") return "bg-[color:var(--ok)] text-black";
    if (k === "intermediate") return "bg-[color:var(--warn)] text-black";
    if (k === "expert") return "bg-[color:var(--err)] text-black";
    return "bg-[var(--border)] text-[var(--foreground)]/70";
  };

  const toggleTag = (t: string) =>
    setCompTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  /* ---------------- Render ---------------- */
  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {greeting ? `Welcome back, ${greeting}` : "Welcome back"}
            </h1>
            <div className="accent-underline mt-3" />
            <p className="mt-2 text-sm md:text-base text-[var(--muted)]">
              Asia Pacific Society of Cardiology TCIP IVUS Course
            </p>
          </div>

          <button
            onClick={() => setCompsOpen(true)}
            className="rounded-xl px-3 py-2 text-sm text-white"
            style={{ background: "var(--accent)" }}
            title="Browse all competencies"
          >
            Browse competencies
          </button>
        </div>
      </section>

      {/* KPI widgets */}
      <section className="mx-auto max-w-6xl px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI
            title="Active Trainees"
            value={kpiActiveTrainees}
            sub="with accounts"
          />
          <KPI
            title="Pending Assessments"
            value={kpiPendingAssessments}
            sub="awaiting grading"
          />
          <KPI
            title="Avg Program Score"
            value={`${kpiAvgProgramScore}%`}
            sub="all trainees"
          />
          <KPI
            title="This Month"
            value={kpiThisMonthAssessments}
            sub="assessments submitted"
          />
        </div>
      </section>

      {/* Errors */}
      <section className="mx-auto max-w-6xl px-6">
        {err && (
          <div className="mb-4 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}
      </section>

      {/* Trainees list */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">Your Trainees</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--field)]">
            <input
              value={studentsQ}
              onChange={(e) => setStudentsQ(e.target.value)}
              placeholder="Search trainees by name or email…"
              className="w-72 bg-transparent px-3 py-2 text-sm outline-none placeholder:[color:var(--muted)]"
            />
          </div>
        </div>

        <div className="space-y-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl border border-[var(--border)] bg-[var(--surface)] animate-pulse"
              />
            ))}

          {!loading && filteredStudents.length === 0 && (
            <div className="text-sm text-[var(--muted)]">
              No trainees found.
            </div>
          )}

          {!loading &&
            filteredStudents.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/instructor/student/${s.id}`)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left hover:shadow-md transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{s.name}</div>
                    <div className="text-xs text-[var(--muted)] truncate">
                      {s.email}
                    </div>

                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <KPIInline label="Overall Progress">
                        <span className="font-semibold">{s.avgPct}%</span>
                        <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-[var(--field)] border border-[var(--border)]">
                          <div
                            className="h-full"
                            style={{
                              width: `${s.avgPct}%`,
                              background: "var(--accent)",
                            }}
                          />
                        </div>
                      </KPIInline>

                      <KPIInline label="Competencies">
                        <span className="font-semibold">
                          {s.completedCount}/{s.assignedCount}
                        </span>
                      </KPIInline>

                      <KPIInline label="Total Assessments">
                        <span className="font-semibold">{s.assessments}</span>
                      </KPIInline>

                      <KPIInline label="Last Assessment">
                        <span className="font-semibold">
                          {s.lastAnsweredAt
                            ? new Date(s.lastAnsweredAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </KPIInline>
                    </div>
                  </div>

                  {/* Chevron */}
                  <span
                    className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "var(--accent)", color: "white" }}
                    aria-hidden
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </button>
            ))}
        </div>
      </section>

      {/* Browse Competencies (read-only) */}
      {compsOpen && (
        <Modal onClose={() => setCompsOpen(false)} title="All competencies">
          <p className="text-sm text-[var(--muted)]">
            Read-only list. Trainees now self-enroll from their dashboard.
          </p>

          {/* Controls */}
          <div className="mt-3 flex flex-col gap-3">
            {/* Difficulty chips */}
            <div className="flex items-center gap-2 text-xs">
              <FilterChip
                label="All"
                active={compDiff === "all"}
                onClick={() => setCompDiff("all")}
              />
              <FilterChip
                label="Beginner"
                color="var(--ok)"
                active={compDiff === "beginner"}
                onClick={() => setCompDiff("beginner")}
              />
              <FilterChip
                label="Intermediate"
                color="var(--warn)"
                active={compDiff === "intermediate"}
                onClick={() => setCompDiff("intermediate")}
              />
              <FilterChip
                label="Expert"
                color="var(--err)"
                active={compDiff === "expert"}
                onClick={() => setCompDiff("expert")}
              />
              {compsLoading && (
                <span className="ms-auto text-xs text-[var(--muted)]">
                  Loading…
                </span>
              )}
            </div>

            {/* Search */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--field)]">
              <input
                value={compsQ}
                onChange={(e) => setCompsQ(e.target.value)}
                placeholder="Search by name, tag, or difficulty…"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:[color:var(--muted)]"
              />
            </div>

            {/* Tag multi-select */}
            <div className="flex flex-wrap gap-1">
              {allCompTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={[
                    "text-[10px] rounded-full border px-2 py-0.5 transition",
                    compTags.has(t)
                      ? "bg-[var(--accent)] text-white border-transparent"
                      : "bg-[var(--surface)] text-[var(--foreground)]/80 border-[var(--border)] hover:bg-[var(--field)]",
                  ].join(" ")}
                  title={t}
                >
                  {t}
                </button>
              ))}
              {allCompTags.length === 0 && (
                <span className="text-xs text-[var(--muted)]">
                  No tags available.
                </span>
              )}
            </div>
          </div>

          {/* List */}
          {compsErr && (
            <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {compsErr}
            </div>
          )}

          <ListBox>
            {filteredComps.map((c) => (
              <ListRow key={c.id}>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {c.name ?? "Untitled competency"}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {c.difficulty ?? "—"}
                    {c.tags?.length
                      ? ` • ${c.tags.slice(0, 4).join(", ")}`
                      : ""}
                  </div>
                </div>
                {c.difficulty && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeForDiff(
                      c.difficulty
                    )}`}
                  >
                    {c.difficulty}
                  </span>
                )}
              </ListRow>
            ))}
            {!compsLoading && filteredComps.length === 0 && (
              <EmptyRow>
                No competencies match your filters.
                <br />
                <span className="text-[var(--muted)]">
                  If you expect items here, they might be hidden by RLS.
                </span>
              </EmptyRow>
            )}
          </ListBox>
        </Modal>
      )}
    </main>
  );
}

/* --------------- Small presentational bits --------------- */

function KPI({
  title,
  value,
  sub,
}: {
  title: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-sm text-[var(--muted)]">{title}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-[var(--muted)] mt-1">{sub}</div>}
    </div>
  );
}

function KPIInline({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

/* Reusable modal + list bits */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-[var(--field)] px-2 py-1 text-sm"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ListBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-[var(--border)]">
      <ul>{children}</ul>
    </div>
  );
}
function ListRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2 border-b border-[var(--border)] last:border-0">
      {children}
    </li>
  );
}
function EmptyRow({ children }: { children: React.ReactNode }) {
  return <li className="px-3 py-6 text-sm text-[var(--muted)]">{children}</li>;
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
