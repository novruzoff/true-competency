// src/app/trainee/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  const supabase = createClientComponentClient();

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
          return;
        }

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
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const totalAssigned = rows.length;
  const avgPct = useMemo(() => {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((acc, r) => acc + r.pct, 0);
    return Math.round(sum / rows.length);
  }, [rows]);

  return (
    // Global header/footer come from layout — no local header here
    <main className="bg-[var(--background)] text-[var(--foreground)] transition-colors">
      {/* Page hero (big, clear) */}
      <section className="mx-auto max-w-5xl px-6 pt-8 pb-6">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Trainee dashboard
        </h1>
        <div className="accent-underline mt-3" />
        <p className="mt-3 text-sm md:text-base text-[var(--muted)] max-w-prose">
          Review your assigned topics, continue where you left off, and track
          your progress toward competency.
        </p>
      </section>

      {/* Notices */}
      <section className="mx-auto max-w-5xl px-6 py-3">
        {err && (
          <div className="mb-3 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200 shadow">
            {err}
          </div>
        )}
        {competenciesVisible === false && (
          <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
            Heads-up: <b className="text-[var(--foreground)]">competencies</b>{" "}
            returned 0 rows (empty or hidden by RLS).
          </div>
        )}
      </section>

      {/* KPIs */}
      <section className="mx-auto max-w-5xl px-6 pb-8">
        <div className="mb-4 flex items-center gap-3 text-sm text-[var(--muted)]">
          <span>
            Assigned topics:{" "}
            <span className="text-[var(--foreground)] font-medium">
              {totalAssigned}
            </span>
          </span>
          <span className="opacity-50">•</span>
          <span>
            Average progress:{" "}
            <span className="text-[var(--foreground)] font-medium">
              {avgPct}%
            </span>
          </span>
        </div>

        {loading && <div className="text-[var(--muted)]">Loading…</div>}
        {!loading && rows.length === 0 && !err && (
          <div className="text-[var(--muted)]">No assignments yet.</div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-3">
          {rows.map((r) => {
            const title =
              r.competency.name ?? `Topic ${r.competency.id.slice(0, 8)}…`;
            const diff = r.competency.difficulty ?? "—";

            return (
              <article
                key={r.competency_id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{title}</h3>
                  <span className="rounded-full bg-[color:var(--accent)] px-2.5 py-1 text-[10px] font-bold text-white">
                    {diff}
                  </span>
                </div>

                <div className="mt-2 text-xs text-[var(--muted)]">
                  {r.answered_questions}/{r.total_questions} answered
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--field)]">
                  <div
                    className="h-full"
                    style={{ width: `${r.pct}%`, background: "var(--accent)" }}
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/trainee/competency/${r.competency_id}`}
                    className="text-sm text-[var(--accent)] underline underline-offset-4 hover:opacity-80"
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
