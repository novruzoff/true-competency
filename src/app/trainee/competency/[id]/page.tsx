// src/app/trainee/competency/[id]/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ------------------------- Types ------------------------- */
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

type Option = {
  id: string;
  question_id: string;
  label: string; // "A" | "B" | ...
  body: string;
  is_correct: boolean; // never shown to trainee
};

type Answer = {
  student_id: string;
  question_id: string;
  is_correct: boolean | null; // MCQ -> true/false, long-answer -> null
  answered_at: string;
};

type OptionsByQ = Record<string, Option[]>;

/* --------------------- Utils ---------------------- */
const ACCENT = "var(--accent)";
const FG = "var(--foreground)";
const BG = "var(--background)";
const BORDER = "var(--border)";

// softer/muted text via color-mix so it adapts to light/dark automatically
const muted = (ratio = 55) =>
  `color-mix(in srgb, var(--foreground) ${
    100 - ratio
  }%, transparent ${ratio}%)`;

function getErrorMessage(e: unknown) {
  if (!e) return "Unknown error";
  if (e instanceof Error) return e.message;
  const any = e as { message?: string; details?: string; hint?: string };
  if (any?.message)
    return [any.message, any.details, any.hint].filter(Boolean).join(" — ");
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

/* --------------------- Page ---------------------- */
export default function TraineeCompetencyPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const competencyId = params.id;

  // session/user
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // data
  const [competency, setCompetency] = useState<Competency | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [optionsByQ, setOptionsByQ] = useState<OptionsByQ>({});
  const [answers, setAnswers] = useState<Record<string, Answer>>({}); // by question_id

  // UI/local
  const [choice, setChoice] = useState<Record<string, string>>({}); // qid -> optionId
  const [loading, setLoading] = useState(true);
  const [savingQ, setSavingQ] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // refs per question for auto-scroll after "wrong"
  const qRefs = useRef<Record<string, HTMLElement | null>>({});

  // progress
  const total = questions.length;
  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );
  const pct = total ? Math.round((answeredCount / total) * 100) : 0;

  /* -------------------- Initial load -------------------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data: u, error: uerr } = await supabase.auth.getUser();
        if (uerr) throw uerr;
        const uid = u.user?.id ?? null;
        setUserId(uid);
        setUserEmail(u.user?.email ?? null);
        if (!uid) {
          router.replace(
            `/signin?redirect=/trainee/competency/${competencyId}`
          );
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
        const list = qs ?? [];
        setQuestions(list);

        // options (MCQ) for all questions
        if (list.length > 0) {
          const ids = list.map((q) => q.id);
          const { data: opts, error: oerr } = await supabase
            .from("question_options")
            .select("id, question_id, label, body, is_correct")
            .in("question_id", ids)
            .order("label", { ascending: true })
            .returns<Option[]>();
          if (oerr) throw oerr;

          const byQ: OptionsByQ = {};
          (opts ?? []).forEach((o) => {
            if (!byQ[o.question_id]) byQ[o.question_id] = [];
            byQ[o.question_id].push(o);
          });
          setOptionsByQ(byQ);
        } else {
          setOptionsByQ({});
        }

        // existing answers
        if (list.length > 0 && uid) {
          const ids = list.map((q) => q.id);
          const { data: ans, error: aerr } = await supabase
            .from("student_answers")
            .select("student_id, question_id, is_correct, answered_at")
            .eq("student_id", uid)
            .in("question_id", ids)
            .returns<Answer[]>();
          if (aerr) throw aerr;

          const byId: Record<string, Answer> = {};
          (ans ?? []).forEach((a) => (byId[a.question_id] = a));
          setAnswers(byId);
        } else {
          setAnswers({});
        }
      } catch (e) {
        setErr(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [competencyId, router]);

  /* -------------------- Handlers -------------------- */
  // Submit MCQ (selected_option_id only; trigger computes is_correct)
  async function submitMCQ(qid: string) {
    if (!userId) return;
    const selected = choice[qid];
    if (!selected) {
      setErr("Please select an option first.");
      return;
    }

    setSavingQ(qid);
    setErr(null);
    try {
      // optimistic (just mark as answered locally)
      setAnswers((prev) => ({
        ...prev,
        [qid]: {
          student_id: userId,
          question_id: qid,
          is_correct: prev[qid]?.is_correct ?? null,
          answered_at: new Date().toISOString(),
        },
      }));

      const { error } = await supabase.from("student_answers").upsert(
        {
          student_id: userId,
          question_id: qid,
          selected_option_id: selected, // trigger sets is_correct
          answered_at: new Date().toISOString(),
        },
        { onConflict: "student_id,question_id" }
      );
      if (error) throw error;

      // re-fetch this answer to show correctness
      const { data: refreshed, error: rerr } = await supabase
        .from("student_answers")
        .select("student_id, question_id, is_correct, answered_at")
        .eq("student_id", userId)
        .eq("question_id", qid)
        .single<Answer>();
      if (rerr) throw rerr;

      setAnswers((prev) => ({ ...prev, [qid]: refreshed }));

      // if wrong, scroll into view for quick retry
      if (refreshed?.is_correct === false) {
        qRefs.current[qid]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setSavingQ(null);
    }
  }

  /* -------------------- Render -------------------- */
  return (
    <div
      className="min-h-screen"
      style={{
        background: BG,
        color: FG,
      }}
    >
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/trainee")}
              className="rounded-lg px-3 py-1.5 text-sm"
              style={{
                border: `1px solid ${BORDER}`,
                background: BG,
              }}
            >
              ← Back
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">
                {competency ? competency.name : "Loading…"}
              </h1>
              <p
                className="text-xs"
                style={{ color: muted(55) }}
                title={userEmail ?? undefined}
              >
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
        {/* Top line: answered count */}
        <div className="mb-4 text-sm" style={{ color: muted(45) }}>
          {answeredCount}/{total} answered • {pct}%
        </div>

        {err && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              border: "1px solid #f199a2",
              background:
                "color-mix(in srgb, var(--foreground) 4%, transparent 96%)",
              color: "#9b1c2e",
            }}
          >
            {err}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl animate-pulse"
                style={{ border: `1px solid ${BORDER}`, background: BG }}
              />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div
            className="rounded-xl p-5"
            style={{ border: `1px solid ${BORDER}`, background: BG }}
          >
            <p className="text-sm" style={{ color: muted(40) }}>
              No questions have been added to this competency yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const a = answers[q.id];
              const isCorrect = a?.is_correct === true;
              const isWrong = a?.is_correct === false;
              const opts = optionsByQ[q.id] ?? [];

              return (
                <article
                  key={q.id}
                  ref={(el) => {
                    qRefs.current[q.id] = el;
                  }}
                  className="rounded-xl p-4"
                  style={{ border: `1px solid ${BORDER}`, background: BG }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs" style={{ color: muted(55) }}>
                        Question {idx + 1}
                      </div>
                      <div className="mt-1">{q.body}</div>
                    </div>

                    <span
                      className="rounded-full px-2 py-1 text-[11px] font-semibold border"
                      style={
                        isCorrect
                          ? {
                              background: "#34d399",
                              color: "#0b0b0b",
                              borderColor: "#34d399",
                            }
                          : isWrong
                          ? {
                              background: "#fb7185",
                              color: "#0b0b0b",
                              borderColor: "#fb7185",
                            }
                          : { borderColor: BORDER, color: muted(35) }
                      }
                    >
                      {isCorrect ? "Correct" : isWrong ? "Wrong" : "Unanswered"}
                    </span>
                  </div>

                  {/* Answer UI */}
                  <div className="mt-3">
                    {opts.length > 0 ? (
                      // --- MCQ ---
                      <div className="space-y-2">
                        {opts.map((o) => (
                          <label
                            key={o.id}
                            className="flex items-start gap-2 rounded-lg p-3 cursor-pointer"
                            style={{
                              border: `1px solid ${BORDER}`,
                              background: "var(--background)",
                            }}
                          >
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              className="mt-1"
                              value={o.id}
                              disabled={isCorrect || savingQ === q.id}
                              checked={choice[q.id] === o.id}
                              onChange={() =>
                                setChoice((prev) => ({ ...prev, [q.id]: o.id }))
                              }
                            />
                            <div>
                              <div
                                className="text-xs"
                                style={{ color: muted(55) }}
                              >
                                {o.label}
                              </div>
                              <div className="text-sm" style={{ color: FG }}>
                                {o.body}
                              </div>
                            </div>
                          </label>
                        ))}

                        <div className="flex justify-end">
                          <button
                            onClick={() => submitMCQ(q.id)}
                            disabled={
                              isCorrect || !choice[q.id] || savingQ === q.id
                            }
                            className="rounded-lg px-3 py-2 text-sm"
                            style={{
                              border: `1px solid ${BORDER}`,
                              background: "var(--background)",
                              color: choice[q.id] ? FG : muted(40),
                              boxShadow: choice[q.id]
                                ? "0 8px 24px rgba(81,112,255,0.18)"
                                : "none",
                            }}
                          >
                            {isCorrect ? "Saved" : "Submit answer"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // --- Long-answer placeholder ---
                      <div className="space-y-2">
                        <textarea
                          className="w-full min-h-24 rounded-lg p-3 outline-none"
                          placeholder="Type your answer…"
                          disabled
                          style={{
                            border: `1px solid ${BORDER}`,
                            background: "var(--background)",
                            color: FG,
                          }}
                        />
                        <div className="text-xs" style={{ color: muted(50) }}>
                          (Long-answer grading to be implemented)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timestamp/status */}
                  {a && (
                    <div className="mt-3 text-xs" style={{ color: muted(50) }}>
                      Saved {new Date(a.answered_at).toLocaleString()} •{" "}
                      {a.is_correct === null
                        ? "Awaiting grading"
                        : a.is_correct
                        ? "Correct"
                        : "Wrong"}
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
      <div className="mb-1 text-xs" style={{ color: muted(50) }}>
        Progress
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: `color-mix(in srgb, ${ACCENT} 20%, transparent)` }}
      >
        <div
          className="h-2"
          style={{
            width: `${pct}%`,
            transition: "width .25s ease",
            background: "#34d399", // keep your green
          }}
        />
      </div>
      <div className="mt-1 text-right text-xs" style={{ color: muted(50) }}>
        {pct}%
      </div>
    </div>
  );
}
