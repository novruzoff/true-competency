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

type ProgressRow = { student_id: string; pct: number; competency_id?: string };
type AssignRow = {
  student_id: string;
  competency_id: string;
  assigned_at?: string;
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  avgPct: number; // mean across competencies
  assessments: number; // total answers
  lastAnsweredAt: string | null;
  assignedCount: number; // total assignments
  completedCount: number; // pct >= 100
};

type Competency = {
  id: string;
  name: string | null;
  difficulty: string | null; // Beginner | Intermediate | Expert
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

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentsQ, setStudentsQ] = useState("");

  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [compsQ, setCompsQ] = useState("");

  // KPI widgets
  const [kpiActiveTrainees, setKpiActiveTrainees] = useState(0);
  const [kpiPendingAssessments, setKpiPendingAssessments] = useState(0);
  const [kpiAvgProgramScore, setKpiAvgProgramScore] = useState(0);
  const [kpiThisMonthAssessments, setKpiThisMonthAssessments] = useState(0);

  // Per-card assign modal (one competency → many trainees)
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCompId, setAssignCompId] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  // Bulk assign modal (many competencies × many trainees)
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSearchStudents, setBulkSearchStudents] = useState("");
  const [bulkSearchComps, setBulkSearchComps] = useState("");
  const [bulkSelectedStudentIds, setBulkSelectedStudentIds] = useState<
    Set<string>
  >(new Set());
  const [bulkSelectedCompIds, setBulkSelectedCompIds] = useState<Set<string>>(
    new Set()
  );
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  /* --- Load data --- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr(null);
        setLoading(true);

        // 1) All trainees
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

        // base
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

        // 2) Aggregates: progress (avg + completedCount)
        let avgById = new Map<string, { sum: number; count: number }>();
        let completedById = new Map<string, number>();

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

        // 3) Total assignedCount from competency_assignments
        let assignedById = new Map<string, number>();
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

        // 4) Answers aggregate for assessments & last date
        let answersById = new Map<
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

        // 5) Merge
        let merged: StudentRow[] = baseStudents.map((s) => {
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

        // 6) All competencies (sorted by difficulty then name)
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
        if (!cancelled) setCompetencies(sorted);

        // 7) KPIs
        if (!cancelled) {
          setKpiActiveTrainees(merged.length);

          const monthStart = new Date();
          monthStart.setDate(1);

          const { data: pending } = await supabase
            .from("student_answers")
            .select("question_id", { head: true, count: "exact" })
            .is("is_correct", null);
          setKpiPendingAssessments((pending as any)?.length ?? 0);

          const avgProg =
            merged.length > 0
              ? Math.round(
                  merged.reduce((s, r) => s + (r.avgPct || 0), 0) /
                    merged.length
                )
              : 0;
          setKpiAvgProgramScore(avgProg);

          const { data: thisMonth } = await supabase
            .from("student_answers")
            .select("question_id", { head: true, count: "exact" })
            .gte("answered_at", monthStart.toISOString());
          setKpiThisMonthAssessments((thisMonth as any)?.length ?? 0);
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
  }, []);

  /* --- Derived filters --- */
  const filteredStudents = useMemo(() => {
    const q = studentsQ.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [studentsQ, students]);

  const filteredComps = useMemo(() => {
    const q = compsQ.trim().toLowerCase();
    if (!q) return competencies;
    return competencies.filter((c) => {
      const hay =
        (c.name ?? "") +
        " " +
        (c.difficulty ?? "") +
        " " +
        (c.tags ?? []).join(" ");
      return hay.toLowerCase().includes(q);
    });
  }, [compsQ, competencies]);

  /* --- Assign Modal helpers (one comp → many trainees) --- */
  const assignableStudents = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [assignSearch, students]);

  function openAssignModal(compId: string) {
    setAssignCompId(compId);
    setAssignOpen(true);
    setAssignSearch("");
    setSelectedIds(new Set());
    setAssignMsg(null);
  }
  function toggleAll(currentList: StudentRow[]) {
    if (selectedIds.size === currentList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentList.map((s) => s.id)));
    }
  }
  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  async function submitAssignSingleComp() {
    if (!assignCompId || selectedIds.size === 0) return;
    setAssigning(true);
    setAssignMsg(null);
    try {
      const rows: AssignRow[] = Array.from(selectedIds).map((sid) => ({
        student_id: sid,
        competency_id: assignCompId,
        assigned_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("competency_assignments")
        .upsert(rows, { onConflict: "student_id,competency_id" });
      if (error) throw error;

      setAssignMsg(
        `Assigned to ${rows.length} trainee${rows.length === 1 ? "" : "s"}.`
      );
    } catch (e) {
      setAssignMsg(e instanceof Error ? e.message : "Failed to assign.");
    } finally {
      setAssigning(false);
    }
  }

  /* --- Bulk assign (many comps × many trainees) --- */
  const bulkStudentPool = useMemo(() => {
    const q = bulkSearchStudents.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [bulkSearchStudents, students]);
  const bulkCompPool = useMemo(() => {
    const q = bulkSearchComps.trim().toLowerCase();
    if (!q) return competencies;
    return competencies.filter((c) => {
      const hay =
        (c.name ?? "") +
        " " +
        (c.difficulty ?? "") +
        " " +
        (c.tags ?? []).join(" ");
      return hay.toLowerCase().includes(q);
    });
  }, [bulkSearchComps, competencies]);

  function bulkToggleAllStudents(list: StudentRow[]) {
    setBulkSelectedStudentIds((prev) => {
      if (prev.size === list.length) return new Set();
      return new Set(list.map((s) => s.id));
    });
  }
  function bulkToggleAllComps(list: Competency[]) {
    setBulkSelectedCompIds((prev) => {
      if (prev.size === list.length) return new Set();
      return new Set(list.map((c) => c.id));
    });
  }
  function bulkToggleStudent(id: string) {
    setBulkSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function bulkToggleComp(id: string) {
    setBulkSelectedCompIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submitBulkAssign() {
    setBulkAssigning(true);
    setBulkMsg(null);
    try {
      const studentIds = Array.from(bulkSelectedStudentIds);
      const compIds = Array.from(bulkSelectedCompIds);
      const now = new Date().toISOString();

      const rows: AssignRow[] = [];
      for (const sid of studentIds) {
        for (const cid of compIds) {
          rows.push({ student_id: sid, competency_id: cid, assigned_at: now });
        }
      }
      if (rows.length === 0) {
        setBulkMsg("Select at least one trainee and one competency.");
        setBulkAssigning(false);
        return;
      }

      const { error } = await supabase
        .from("competency_assignments")
        .upsert(rows, { onConflict: "student_id,competency_id" });
      if (error) throw error;

      setBulkMsg(
        `Assigned ${compIds.length} competency${
          compIds.length === 1 ? "" : "ies"
        } to ${studentIds.length} trainee${studentIds.length === 1 ? "" : "s"}.`
      );
    } catch (e) {
      setBulkMsg(e instanceof Error ? e.message : "Bulk assign failed.");
    } finally {
      setBulkAssigning(false);
    }
  }

  /* --- UI helpers --- */
  const badgeForDiff = (d: string | null) => {
    const k = (d ?? "").toLowerCase();
    if (k === "beginner") return "bg-[color:var(--ok)] text-black";
    if (k === "intermediate") return "bg-[color:var(--warn)] text-black";
    if (k === "expert") return "bg-[color:var(--err)] text-black";
    return "bg-[var(--border)] text-[var(--foreground)]/70";
  };

  /* ---------------- Render ---------------- */
  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Instructor dashboard
            </h1>
            <div className="accent-underline mt-3" />
            <p className="mt-2 text-sm md:text-base text-[var(--muted)]">
              Manage trainees, review progress, and explore competencies.
            </p>
          </div>
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
            sub="across all trainees"
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
      <section className="mx-auto max-w-6xl px-6 pb-6">
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

      {/* All Competencies */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">All Competencies</h2>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--field)]">
              <input
                value={compsQ}
                onChange={(e) => setCompsQ(e.target.value)}
                placeholder="Search competencies by name, tag, or difficulty…"
                className="w-96 bg-transparent px-3 py-2 text-sm outline-none placeholder:[color:var(--muted)]"
              />
            </div>
            <button
              onClick={() => setBulkOpen(true)}
              className="rounded-xl px-3 py-2 text-sm text-white"
              style={{ background: "var(--accent)" }}
              title="Bulk assign competencies"
            >
              Bulk Assign
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredComps.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold leading-tight truncate">
                    {c.name ?? "Untitled competency"}
                  </h3>
                  {c.difficulty && (
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeForDiff(
                        c.difficulty
                      )}`}
                    >
                      {c.difficulty}
                    </span>
                  )}
                </div>

                {/* Assign (+) */}
                <button
                  onClick={() => openAssignModal(c.id)}
                  className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-xl text-white"
                  style={{ background: "var(--accent)" }}
                  title="Assign to trainees"
                >
                  +
                </button>
              </div>

              {!!c.tags?.length && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags!.slice(0, 6).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[var(--foreground)]/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Assign Modal: one competency → many trainees */}
      {assignOpen && (
        <Modal onClose={() => setAssignOpen(false)} title="Assign competency">
          <p className="text-sm text-[var(--muted)]">
            Choose one or more trainees for this competency.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--field)]">
              <input
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Search trainees…"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:[color:var(--muted)]"
              />
            </div>
            <button
              onClick={() => toggleAll(assignableStudents)}
              className="rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm"
            >
              {selectedIds.size === assignableStudents.length
                ? "Clear all"
                : "Select all"}
            </button>
          </div>

          <ListBox>
            {assignableStudents.map((s) => {
              const checked = selectedIds.has(s.id);
              return (
                <ListRow key={s.id}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-[var(--muted)] truncate">
                      {s.email}
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(s.id)}
                    />
                    <span className="text-sm">Select</span>
                  </label>
                </ListRow>
              );
            })}
            {assignableStudents.length === 0 && (
              <EmptyRow>No trainees match your search.</EmptyRow>
            )}
          </ListBox>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-[var(--muted)]">
              {selectedIds.size} selected
            </div>
            <button
              disabled={assigning || selectedIds.size === 0}
              onClick={submitAssignSingleComp}
              className="rounded-xl px-4 py-2 text-sm text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {assigning ? "Assigning…" : "Assign"}
            </button>
          </div>

          {assignMsg && <div className="mt-3 text-sm">{assignMsg}</div>}
        </Modal>
      )}

      {/* Bulk Assign Modal: many comps × many trainees */}
      {bulkOpen && (
        <Modal
          onClose={() => setBulkOpen(false)}
          title="Bulk assign competencies"
        >
          <p className="text-sm text-[var(--muted)]">
            Select multiple trainees and competencies. We’ll assign every
            selected competency to every selected trainee.
          </p>

          {/* Pick trainees */}
          <h4 className="mt-4 text-sm font-semibold">Trainees</h4>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--field)]">
              <input
                value={bulkSearchStudents}
                onChange={(e) => setBulkSearchStudents(e.target.value)}
                placeholder="Search trainees…"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:[color:var(--muted)]"
              />
            </div>
            <button
              onClick={() => bulkToggleAllStudents(bulkStudentPool)}
              className="rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm"
            >
              {bulkSelectedStudentIds.size === bulkStudentPool.length
                ? "Clear all"
                : "Select all"}
            </button>
          </div>

          <ListBox>
            {bulkStudentPool.map((s) => {
              const checked = bulkSelectedStudentIds.has(s.id);
              return (
                <ListRow key={s.id}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-[var(--muted)] truncate">
                      {s.email}
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => bulkToggleStudent(s.id)}
                    />
                    <span className="text-sm">Select</span>
                  </label>
                </ListRow>
              );
            })}
            {bulkStudentPool.length === 0 && (
              <EmptyRow>No trainees match your search.</EmptyRow>
            )}
          </ListBox>

          {/* Pick competencies */}
          <h4 className="mt-5 text-sm font-semibold">Competencies</h4>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--field)]">
              <input
                value={bulkSearchComps}
                onChange={(e) => setBulkSearchComps(e.target.value)}
                placeholder="Search competencies…"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:[color:var(--muted)]"
              />
            </div>
            <button
              onClick={() => bulkToggleAllComps(bulkCompPool)}
              className="rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm"
            >
              {bulkSelectedCompIds.size === bulkCompPool.length
                ? "Clear all"
                : "Select all"}
            </button>
          </div>

          <ListBox>
            {bulkCompPool.map((c) => {
              const checked = bulkSelectedCompIds.has(c.id);
              return (
                <ListRow key={c.id}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {c.name ?? "Untitled competency"}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {c.difficulty ?? "—"}
                      {c.tags?.length
                        ? ` • ${c.tags.slice(0, 3).join(", ")}`
                        : ""}
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => bulkToggleComp(c.id)}
                    />
                    <span className="text-sm">Select</span>
                  </label>
                </ListRow>
              );
            })}
            {bulkCompPool.length === 0 && (
              <EmptyRow>No competencies match your search.</EmptyRow>
            )}
          </ListBox>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-[var(--muted)]">
              {bulkSelectedStudentIds.size} trainees •{" "}
              {bulkSelectedCompIds.size} competencies
            </div>
            <button
              disabled={
                bulkAssigning ||
                bulkSelectedStudentIds.size === 0 ||
                bulkSelectedCompIds.size === 0
              }
              onClick={submitBulkAssign}
              className="rounded-xl px-4 py-2 text-sm text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {bulkAssigning ? "Assigning…" : "Assign"}
            </button>
          </div>

          {bulkMsg && <div className="mt-3 text-sm">{bulkMsg}</div>}
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
  value: any;
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
    <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-[var(--border)]">
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
