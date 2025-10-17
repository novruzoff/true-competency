"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Question = {
  id: string;
  body: string;
};

type Option = {
  id: string;
  question_id: string;
  label: string;
  body: string;
  is_correct: boolean;
};

type Answer = {
  student_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct: boolean | null;
  answered_at: string | null;
};

type Props = {
  studentId: string;
  competencyId: string;
  open: boolean;
  onClose: () => void;
};

export default function GradeDrawer({
  studentId,
  competencyId,
  open,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [optionsByQ, setOptionsByQ] = useState<Record<string, Option[]>>({});
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>(
    {}
  );

  const sorted = useMemo(() => {
    return [...questions].sort((a, b) => a.id.localeCompare(b.id));
  }, [questions]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // Load questions for competency
        const { data: qs, error: qErr } = await supabase
          .from("competency_questions")
          .select("id, body")
          .eq("competency_id", competencyId)
          .order("created_at", { ascending: true })
          .returns<Question[]>();
        if (qErr) throw qErr;

        if (!cancelled) setQuestions(qs ?? []);

        // Load options
        const qids = (qs ?? []).map((q) => q.id);
        if (qids.length > 0) {
          const { data: opts, error: oErr } = await supabase
            .from("question_options")
            .select("id, question_id, label, body, is_correct")
            .in("question_id", qids)
            .order("label", { ascending: true })
            .returns<Option[]>();
          if (oErr) throw oErr;

          const byQ: Record<string, Option[]> = {};
          (opts ?? []).forEach((o) => {
            if (!byQ[o.question_id]) byQ[o.question_id] = [];
            byQ[o.question_id].push(o);
          });
          if (!cancelled) setOptionsByQ(byQ);
        } else {
          if (!cancelled) setOptionsByQ({});
        }

        // Load answers
        if (qids.length > 0) {
          const { data: ans, error: aErr } = await supabase
            .from("student_answers")
            .select(
              "student_id, question_id, selected_option_id, is_correct, answered_at"
            )
            .eq("student_id", studentId)
            .in("question_id", qids)
            .returns<Answer[]>();
          if (aErr) throw aErr;

          const byId: Record<string, Answer> = {};
          (ans ?? []).forEach((a) => (byId[a.question_id] = a));
          if (!cancelled) setAnswers(byId);
        } else {
          if (!cancelled) setAnswers({});
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
  }, [open, competencyId, studentId]);

  async function markCorrect(qid: string, correct: boolean) {
    setErr(null);
    try {
      const { error } = await supabase
        .from("student_answers")
        .update({ is_correct: correct })
        .eq("student_id", studentId)
        .eq("question_id", qid);
      if (error) throw error;

      setAnswers((prev) => ({
        ...prev,
        [qid]: prev[qid]
          ? { ...prev[qid]!, is_correct: correct }
          : {
              student_id: studentId,
              question_id: qid,
              selected_option_id: null,
              is_correct: correct,
              answered_at: new Date().toISOString(),
            },
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* scrim */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* drawer */}
      <div className="absolute right-0 top-0 h-full w-[min(540px,92vw)] bg-[var(--surface)] border-l border-[var(--border)] shadow-xl p-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Grade answers</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm border border-[var(--border)] hover:bg-[var(--field)]"
          >
            Close
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {loading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse"
                />
              ))}
            </>
          ) : sorted.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">
              No questions for this competency.
            </div>
          ) : (
            sorted.map((q) => {
              const a = answers[q.id];
              const opts = optionsByQ[q.id] ?? [];
              return (
                <article
                  key={q.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                >
                  <div className="text-xs text-[var(--muted)]">Question</div>
                  <div className="mt-1">{q.body}</div>

                  {opts.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {opts.map((o) => (
                        <li
                          key={o.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--border)]">
                            {o.label}
                          </span>
                          <div>
                            <div>{o.body}</div>
                            {o.is_correct && (
                              <div className="text-[11px] text-[var(--muted)]">
                                Expected answer
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => markCorrect(q.id, true)}
                      className="rounded-lg px-3 py-1.5 text-sm border border-[var(--border)] hover:bg-[var(--field)]"
                    >
                      Mark Correct
                    </button>
                    <button
                      onClick={() => markCorrect(q.id, false)}
                      className="rounded-lg px-3 py-1.5 text-sm border border-[var(--border)] hover:bg-[var(--field)]"
                    >
                      Mark Wrong
                    </button>
                    <span className="ml-auto text-xs text-[var(--muted)]">
                      {a?.is_correct === true
                        ? "Marked: Correct"
                        : a?.is_correct === false
                        ? "Marked: Wrong"
                        : "Not graded"}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
