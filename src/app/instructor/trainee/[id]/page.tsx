// src/app/instructor/trainee/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type TraineeProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  role: string;
};

type Competency = {
  id: string;
  name: string | null;
  difficulty: string | null;
  tags: string[] | null;
};

type AssignmentRow = {
  student_id: string;
  competency_id: string;
};

type ProgressRow = {
  student_id: string;
  competency_id: string;
  pct: number;
};

type QuestionRow = {
  competency_id: string;
};

type Item = {
  competency: Competency;
  pct: number;
  hasQuestions: boolean;
};

const DIFF_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};

export default function InstructorTraineeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const traineeId = params?.id;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [trainee, setTrainee] = useState<TraineeProfile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [approving, setApproving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!traineeId) return;
      try {
        setErr(null);
        setLoading(true);

        // 1) Fetch trainee profile
        const { data: t, error: tErr } = await supabase
          .from("profiles")
          .select("id,email,first_name,last_name,full_name,role")
          .eq("id", traineeId)
          .maybeSingle<TraineeProfile>();
        if (tErr) throw tErr;
        if (!t) throw new Error("Trainee not found.");
        if (!cancelled) setTrainee(t);

        // 2) Load the list of competencies the trainee is enrolled in.
        //    We assume the self-enrollment also writes to competency_assignments.
        const { data: assigns, error: aErr } = await supabase
          .from("competency_assignments")
          .select("student_id,competency_id")
          .eq("student_id", traineeId)
          .returns<AssignmentRow[]>();
        if (aErr) throw aErr;

        const compIds = Array.from(
          new Set((assigns ?? []).map((a) => a.competency_id))
        );
        if (compIds.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }

        // 3) Fetch competencies
        const { data: comps, error: cErr } = await supabase
          .from("competencies")
          .select("id,name,difficulty,tags")
          .in("id", compIds)
          .returns<Competency[]>();
        if (cErr) throw cErr;

        // 4) Fetch progress for this trainee on these competencies
        const { data: progress, error: pErr } = await supabase
          .from("student_competency_progress")
          .select("student_id,competency_id,pct")
          .eq("student_id", traineeId)
          .in("competency_id", compIds)
          .returns<ProgressRow[]>();
        if (pErr) throw pErr;

        const pctByComp = new Map<string, number>();
        (progress ?? []).forEach((r) => pctByComp.set(r.competency_id, r.pct));

        // 5) Determine if competency has questions
        const { data: qRows, error: qErr } = await supabase
          .from("competency_questions")
          .select("competency_id")
          .in("competency_id", compIds)
          .returns<QuestionRow[]>();
        if (qErr) throw qErr;
        const hasQ = new Set((qRows ?? []).map((q) => q.competency_id));

        const list: Item[] =
          (comps ?? []).map((c) => ({
            competency: c,
            pct: pctByComp.get(c.id) ?? 0,
            hasQuestions: hasQ.has(c.id),
          })) ?? [];

        // sort: difficulty, name
        list.sort((a, b) => {
          const da =
            DIFF_ORDER[(a.competency.difficulty ?? "").toLowerCase()] ?? 99;
          const db =
            DIFF_ORDER[(b.competency.difficulty ?? "").toLowerCase()] ?? 99;
          if (da !== db) return da - db;
          const an = (a.competency.name ?? "").toLowerCase();
          const bn = (b.competency.name ?? "").toLowerCase();
          return an.localeCompare(bn);
        });

        if (!cancelled) setItems(list);
      } catch (e) {
        const msg =
          typeof e === "object" && e && "message" in e
            ? (e as { message?: string }).message || "Something went wrong."
            : typeof e === "string"
            ? e
            : "Something went wrong.";
        setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [traineeId]);

  async function approve(compId: string) {
    if (!traineeId) return;
    setApproving(compId);
    try {
      // Call secure RPC that records completion in a writeable table (not the view)
      const { error } = await supabase.rpc(
        "instructor_mark_competency_complete",
        {
          p_student_id: traineeId,
          p_competency_id: compId,
        }
      );
      if (error) {
        throw new Error(error.message);
      }

      // reflect locally on success
      setItems((prev) =>
        prev.map((it) =>
          it.competency.id === compId ? { ...it, pct: 100 } : it
        )
      );

      setToast("Competency approved.");
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      // Provide a human-readable error string
      let msg = "Failed to approve competency.";
      if (typeof e === "object" && e && "message" in e) {
        msg = (e as { message?: string }).message || msg;
      } else if (typeof e === "string") {
        msg = e;
      }
      setErr(msg);
    } finally {
      setApproving(null);
    }
  }

  const displayName = useMemo(() => {
    if (!trainee) return "Trainee";
    return (
      trainee.full_name ||
      [trainee.first_name ?? "", trainee.last_name ?? ""].join(" ").trim() ||
      trainee.email ||
      "Trainee"
    );
  }, [trainee]);

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)] min-h-[100dvh]">
      {/* Header */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight truncate">
              {displayName}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)] truncate">
              Enrolled Competencies
            </p>
          </div>

          <button
            onClick={() => router.push("/instructor")}
            className="rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm hover:shadow-sm"
          >
            ← Back
          </button>
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

      {/* List */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-sm text-[var(--muted)]">
            No competencies found for this trainee.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((it) => {
              const c = it.competency;
              const pct = it.pct ?? 0;
              const completed = pct >= 100;
              return (
                <article
                  key={c.id}
                  className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  {/* top-right actions */}
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    {c.difficulty && (
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[var(--field)] border border-[var(--border)] text-[var(--foreground)]/80">
                        {c.difficulty}
                      </span>
                    )}

                    {/* Review chevron if questions exist */}
                    {it.hasQuestions && (
                      <button
                        title="Review answers"
                        onClick={() =>
                          router.push(
                            `/instructor/review/${c.id}?student=${traineeId}`
                          )
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-white transition"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M9 18l6-6-6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  <h3 className="pr-24 font-semibold leading-snug">
                    {c.name ?? "Untitled competency"}
                  </h3>

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

                  <div className="mt-3 flex items-center justify-between gap-3">
                    {/* progress */}
                    <div className="min-w-0">
                      <div className="text-xs text-[var(--muted)]">
                        {completed ? "Completed" : "Progress"}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--field)] border border-[var(--border)]">
                          <div
                            className="h-full"
                            style={{
                              width: `${pct}%`,
                              background: "var(--accent)",
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-8">
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* approve */}
                    <button
                      disabled={completed || approving === c.id}
                      onClick={() => approve(c.id)}
                      className={[
                        "shrink-0 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                        completed
                          ? "border border-[var(--border)] bg-[var(--field)] text-[var(--muted)]"
                          : "border border-emerald-700 bg-emerald-600/90 text-white hover:bg-emerald-600",
                      ].join(" ")}
                    >
                      {approving === c.id
                        ? "Approving…"
                        : completed
                        ? "Approved"
                        : "Approve"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Tiny toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div
            className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm shadow-lg"
            role="status"
          >
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}
