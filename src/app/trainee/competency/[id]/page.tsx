// src/app/trainee/competency/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Params = { id: string };

type Competency = {
  id: string;
  name: string;
  difficulty: string | null;
  tags: string[] | null;
  created_at: string;
};

type Question = {
  id: string;
  competency_id: string;
  body: string;
  created_at: string;
};

type Answer = {
  student_id: string;
  question_id: string;
  is_correct: boolean;
  answered_at: string;
};

export default function TraineeCompetencyPage({ params }: { params: Params }) {
  const router = useRouter();
  const competencyId = params.id;

  // session
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // data
  const [competency, setCompetency] = useState<Competency | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({}); // by question_id

  // ui
  const [loading, setLoading] = useState(true);
  const [savingQ, setSavingQ] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // progress
  const total = questions.length;
  const answered = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );
  const pct = total ? Math.round((answered / total) * 100) : 0;

  // load session + data
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // session
        const { data: u, error: uerr } = await supabase.auth.getUser();
        if (uerr) throw uerr;
        const uid = u.user?.id;
        setUserId(uid ?? null);
        setUserEmail(u.user?.email ?? null);

        if (!uid) {
          router.replace("/signin?redirect=/trainee");
          return;
        }

        // competency
        const { data: comp, error: cerr } = await supabase
          .from("competencies")
          .select("id, name, difficulty, tags, created_at")
          .eq("id", competencyId)
          .single<Competency>();
        if (cerr) throw cerr;
        if (!comp) throw new Error("Competency not found.");
        if (cancelled) return;
        setCompetency(comp);

        // questions
        const { data: qs, error: qerr } = await supabase
          .from("competency_questions")
          .select("id, competency_id, body, created_at")
          .eq("competency_id", competencyId)
          .order("created_at", { ascending: true })
          .returns<Question[]>();
        if (qerr) throw qerr;
        if (cancelled) return;
        setQuestions(qs ?? []);

        // existing answers for this user & these questions
        if ((qs ?? []).length > 0) {
          const ids = (qs ?? []).map((q) => q.id);
          const { data: ans, error: aerr } = await supabase
            .from("student_answers")
            .select("student_id, question_id, is_correct, answered_at")
            .eq("student_id", uid)
            .in("question_id", ids)
            .returns<Answer[]>();
          if (aerr) throw aerr;
          if (cancelled) return;

          const byId: Record<string, Answer> = {};
          (ans ?? []).forEach((a) => (byId[a.question_id] = a));
          setAnswers(byId);
        } else {
          setAnswers({});
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [competencyId, router]);

  async function recordAnswer(qid: string, isCorrect: boolean) {
    if (!userId) return;
    setSavingQ(qid);
    setErr(null);
    try {
      // optimistic
      const optimistic: Answer = {
        student_id: userId,
        question_id: qid,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
      };
      setAnswers((prev) => ({ ...prev, [qid]: optimistic }));

      const { error } = await supabase.from("student_answers").upsert(
        {
          student_id: userId,
          question_id: qid,
          is_correct: isCorrect,
          answered_at: new Date().toISOString(),
        },
        { onConflict: "student_id,question_id" }
      );
      if (error) throw error;
    } catch (e) {
      // rollback optimistic if needed
      setAnswers((prev) => {
        const clone = { ...prev };
        delete clone[qid];
        return clone;
      });
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingQ(null);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/trainee")}
              className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm hover:border-neutral-600"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">
                {competency ? competency.name : "Loading…"}
              </h1>
              <p className="text-xs text-neutral-400">
                {competency?.difficulty ?? "—"} •{" "}
                {userEmail ? `Signed in as ${userEmail}` : "Not signed in"}
              </p>
            </div>
          </div>

          <div className="w-52">
            <Progress pct={pct} />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-5xl px-6 py-6">
        {err && (
          <div className="mb-4 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-neutral-800 bg-neutral-900 animate-pulse"
              />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <p className="text-sm text-neutral-300">
              No questions have been added to this competency yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-neutral-400">
              {answered}/{total} answered • {pct}%
            </div>
            {questions.map((q, idx) => {
              const a = answers[q.id];
              return (
                <article
                  key={q.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-neutral-500">
                        Question {idx + 1}
                      </div>
                      <div className="mt-1 text-neutral-100">{q.body}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => recordAnswer(q.id, true)}
                        disabled={savingQ === q.id}
                        className={[
                          "rounded-lg px-3 py-2 text-sm font-medium border",
                          a?.is_correct
                            ? "bg-emerald-400 text-neutral-900 border-emerald-300"
                            : "bg-neutral-950 text-neutral-100 border-neutral-700 hover:border-neutral-500",
                        ].join(" ")}
                        title="I answered correctly"
                      >
                        Correct
                      </button>
                      <button
                        onClick={() => recordAnswer(q.id, false)}
                        disabled={savingQ === q.id}
                        className={[
                          "rounded-lg px-3 py-2 text-sm font-medium border",
                          a && !a.is_correct
                            ? "bg-yellow-300 text-neutral-900 border-yellow-200"
                            : "bg-neutral-950 text-neutral-100 border-neutral-700 hover:border-neutral-500",
                        ].join(" ")}
                        title="Needs work / incorrect"
                      >
                        Needs work
                      </button>
                    </div>
                  </div>

                  {a && (
                    <div className="mt-3 text-xs text-neutral-400">
                      Saved {new Date(a.answered_at).toLocaleString()} •{" "}
                      {a.is_correct ? "Correct" : "Needs work"}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* ----------------------------- UI Bits --------------------------------- */

function Progress({ pct }: { pct: number }) {
  return (
    <div>
      <div className="text-xs text-neutral-400 mb-1">Progress</div>
      <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-2 bg-emerald-400"
          style={{ width: `${pct}%`, transition: "width .25s ease" }}
        />
      </div>
      <div className="mt-1 text-right text-xs text-neutral-400">{pct}%</div>
    </div>
  );
}
