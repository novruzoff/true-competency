// src/app/trainee/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ChevronAction } from "@/components/ui/ChevronAction";
import { Building2, MapPin } from "lucide-react";

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

  // filters (main page)
  const [diffFilter, setDiffFilter] = useState<
    "all" | "beginner" | "intermediate" | "expert"
  >("all");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchQ, setSearchQ] = useState("");

  // enroll modal state + filters
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [diffFilterEnroll, setDiffFilterEnroll] = useState<
    "all" | "beginner" | "intermediate" | "expert"
  >("all");
  const [selectedTagsEnroll, setSelectedTagsEnroll] = useState<Set<string>>(
    new Set()
  );
  const [searchQEnroll, setSearchQEnroll] = useState("");

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

  /** Bulk-enroll (a.k.a. "Bulk test") by difficulty */
  const bulkEnroll = useCallback(
    async (diff: "beginner" | "intermediate" | "expert" | "all") => {
      if (!me) return;

      // Compute target list from ALL competencies, excluding already enrolled
      const pool =
        diff === "all"
          ? allComps
          : allComps.filter(
              (c) =>
                (c.difficulty ?? "").toLowerCase() === diff &&
                !assignments.has(c.id)
            );

      const targets = pool
        .filter((c) => !assignments.has(c.id))
        .map((c) => c.id);

      if (targets.length === 0) {
        setErr(
          "No competencies available to bulk test for the selected difficulty."
        );
        return;
      }

      // Optimistic update
      setAssignments((prev) => {
        const next = new Set(prev);
        targets.forEach((id) => next.add(id));
        return next;
      });

      const now = new Date().toISOString();
      const rows = targets.map((id) => ({
        student_id: me.id,
        competency_id: id,
        assigned_at: now,
      }));

      const { error } = await supabase
        .from("competency_assignments")
        .upsert(rows, { onConflict: "student_id,competency_id" });

      if (error) {
        // rollback if insert failed
        setAssignments((prev) => {
          const next = new Set(prev);
          targets.forEach((id) => next.delete(id));
          return next;
        });
        setErr(error.message);
      }
    },
    [me, allComps, assignments]
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

  // split enrolled into in-progress vs completed (>= 100%)
  const completedList = useMemo(
    () =>
      enrolledList.filter((c) => (progressByComp.get(c.id)?.pct ?? 0) >= 100),
    [enrolledList, progressByComp]
  );
  const inProgressList = useMemo(
    () =>
      enrolledList.filter((c) => (progressByComp.get(c.id)?.pct ?? 0) < 100),
    [enrolledList, progressByComp]
  );

  // modal-filtered available list
  const availableForModal = useMemo(() => {
    let list = availableList;
    if (diffFilterEnroll !== "all") {
      list = list.filter(
        (c) => (c.difficulty ?? "").toLowerCase() === diffFilterEnroll
      );
    }
    if (selectedTagsEnroll.size > 0) {
      list = list.filter((c) => {
        const tags = new Set(c.tags ?? []);
        for (const t of selectedTagsEnroll) {
          if (!tags.has(t)) return false;
        }
        return true;
      });
    }
    const q = searchQEnroll.trim().toLowerCase();
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
  }, [availableList, diffFilterEnroll, selectedTagsEnroll, searchQEnroll]);

  /* ---------- helpers ---------- */
  const badgeBg = (diff?: string | null) => {
    const k = (diff ?? "").toLowerCase();
    if (k === "beginner") return "var(--ok)";
    if (k === "intermediate") return "var(--warn)";
    if (k === "expert") return "var(--err)";
    return "var(--border)";
  };

  const topStripe = (diff?: string | null) => {
    const base = badgeBg(diff);
    return `${base}`;
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

  const toggleTagEnroll = (t: string) =>
    setSelectedTagsEnroll((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const clearEnrollFilters = () => {
    setDiffFilterEnroll("all");
    setSelectedTagsEnroll(new Set());
    setSearchQEnroll("");
  };

  /* ---------- render ---------- */
  return (
    <main className="bg-[var(--background)] text-[var(--foreground)] transition-colors">
      {/* External Welcome */}
      <section className="mx-auto max-w-6xl px-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {greetingName ? `Welcome back, ${greetingName}` : "Welcome back"}
            </h1>
            <div className="accent-underline mt-3" />
            <p className="mt-2 text-sm md:text-base text-[var(--muted)]">
              Asia Pacific Society of Cardiology TCIP IVUS Course
            </p>
          </div>
        </div>
      </section>

      {/* Profile Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-6 mb-5">
        <div
          className="rounded-2xl border bg-[var(--surface)] overflow-hidden transition will-change-transform"
          style={{
            borderColor:
              "color-mix(in oklab, var(--accent) 40%, var(--border))",
            boxShadow:
              "0 0 0 2px color-mix(in oklab, var(--accent) 22%, transparent), 0 8px 28px color-mix(in oklab, var(--accent) 18%, transparent)",
          }}
        >
          <div className="pt-5 md:pt-6 px-5 md:px-6 pb-5">
            <div className="flex items-start justify-between gap-4">
              {/* left: avatar + text */}
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-semibold shadow-md ring-4 ring-[var(--surface)]"
                  style={{ background: "var(--accent)" }}
                >
                  {getInitials(greetingName || me?.email || "")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight break-words">
                      {greetingName || "Welcome back"}
                    </h1>
                    <span
                      className="text-[10px] md:text-xs font-medium rounded-full px-2 py-0.5 border bg-[var(--field)] text-[var(--foreground)]/90"
                      style={{
                        background:
                          "color-mix(in oklab, var(--accent) 15%, transparent)",
                        borderColor:
                          "color-mix(in oklab, var(--accent) 35%, transparent)",
                        color: "var(--accent)",
                      }}
                    >
                      Active Learner
                    </span>
                  </div>
                  <p className="mt-1 text-xs md:text-sm text-[var(--muted)]">
                    Explore competencies, enroll in topics you want to master,
                    and track your progress.
                  </p>
                  <div className="mt-1 flex items-center gap-4 text-xs md:text-sm text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" aria-hidden />
                      McGill University
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      Canada
                    </span>
                  </div>
                </div>
              </div>

              {/* right: + Enroll */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-medium will-change-transform transition-transform duration-300 ease-out active:scale-[0.98] hover:scale-[1.06]"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    borderColor: "var(--accent)",
                    transition:
                      "transform 300ms cubic-bezier(0.22,1,0.36,1), background-color 220ms ease, color 220ms ease, border-color 220ms ease",
                  }}
                  title="Enroll in a competency"
                >
                  + Test
                </button>
              </div>
            </div>

            {/* Top Stats Row (text only) */}
            <div className="mt-4 flex flex-wrap items-baseline gap-8">
              <StatText
                label="Enrolled"
                value={formatNumber(enrolledList.length)}
                color="var(--accent)"
              />
              <StatText
                label="Completed"
                value={formatNumber(
                  enrolledList.filter(
                    (c) => (progressByComp.get(c.id)?.pct ?? 0) >= 100
                  ).length
                )}
                color="var(--ok)"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEnrollModal(false)}
          />
          <div className="absolute left-1/2 top-12 -translate-x-1/2 w-[min(100%,56rem)] mx-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold">Enroll in a competency</h3>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="rounded-lg border border-[var(--border)] px-2 py-1 text-sm hover:bg-[var(--field)]"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              {/* Filters (same logic as main page) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <FilterChip
                    label="All"
                    active={diffFilterEnroll === "all"}
                    onClick={() => setDiffFilterEnroll("all")}
                  />
                  <FilterChip
                    label="Beginner"
                    color="var(--ok)"
                    active={diffFilterEnroll === "beginner"}
                    onClick={() => setDiffFilterEnroll("beginner")}
                  />
                  <FilterChip
                    label="Intermediate"
                    color="var(--warn)"
                    active={diffFilterEnroll === "intermediate"}
                    onClick={() => setDiffFilterEnroll("intermediate")}
                  />
                  <FilterChip
                    label="Expert"
                    color="var(--err)"
                    active={diffFilterEnroll === "expert"}
                    onClick={() => setDiffFilterEnroll("expert")}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--field)] w-full">
                    <input
                      value={searchQEnroll}
                      onChange={(e) => setSearchQEnroll(e.target.value)}
                      placeholder="Search by name or tag…"
                      className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:[color:var(--muted)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearEnrollFilters}
                    className="rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm hover:bg-[var(--surface)] transition hover:scale-[1.02] active:scale-[0.99]"
                    title="Clear all filters"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {allTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTagEnroll(t)}
                      onMouseEnter={(e) => {
                        if (!selectedTagsEnroll.has(t)) {
                          e.currentTarget.style.background =
                            "color-mix(in oklab, var(--accent) 12%, transparent)";
                          e.currentTarget.style.borderColor =
                            "color-mix(in oklab, var(--accent) 28%, transparent)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedTagsEnroll.has(t)) {
                          e.currentTarget.style.background = "var(--surface)";
                          e.currentTarget.style.borderColor = "var(--border)";
                        }
                      }}
                      className={[
                        "text-[10px] rounded-full border px-2 py-0.5 transition transform hover:scale-[1.03]",
                        selectedTagsEnroll.has(t)
                          ? "text-white border-transparent"
                          : "text-[var(--foreground)]/80",
                      ].join(" ")}
                      style={{
                        background: selectedTagsEnroll.has(t)
                          ? "var(--accent)"
                          : "var(--surface)",
                        borderColor: selectedTagsEnroll.has(t)
                          ? "transparent"
                          : "var(--border)",
                      }}
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

              {/* Bulk test actions */}
              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm font-medium">Bulk test</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bulkEnroll("beginner")}
                      className="rounded-xl border px-3 py-2 text-xs font-medium transition hover:scale-[1.03]"
                      style={{
                        background: "var(--ok)",
                        color: "#000",
                        borderColor:
                          "color-mix(in oklab, var(--ok) 35%, transparent)",
                      }}
                      title="Enroll in all Beginner competencies"
                    >
                      Test all Beginner
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkEnroll("intermediate")}
                      className="rounded-xl border px-3 py-2 text-xs font-medium transition hover:scale-[1.03]"
                      style={{
                        background: "var(--warn)",
                        color: "#000",
                        borderColor:
                          "color-mix(in oklab, var(--warn) 35%, transparent)",
                      }}
                      title="Enroll in all Intermediate competencies"
                    >
                      Test all Intermediate
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkEnroll("expert")}
                      className="rounded-xl border px-3 py-2 text-xs font-medium transition hover:scale-[1.03]"
                      style={{
                        background: "var(--err)",
                        color: "#000",
                        borderColor:
                          "color-mix(in oklab, var(--err) 35%, transparent)",
                      }}
                      title="Enroll in all Expert competencies"
                    >
                      Test all Expert
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkEnroll("all")}
                      className="rounded-xl border px-3 py-2 text-xs font-medium transition hover:scale-[1.03]"
                      style={{
                        background: "var(--field)",
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                      title="Enroll in all available competencies"
                    >
                      Test all Available
                    </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="mt-4 max-h-[60vh] overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableForModal.map((c) => {
                  const title = c.name ?? `Topic ${c.id.slice(0, 8)}…`;
                  const diffRaw = (c.difficulty ?? "").trim();
                  // const p = progressByComp.get(c.id);
                  // const pct = Math.max(
                  //   0,
                  //   Math.min(100, Math.round(p?.pct ?? 0))
                  // );
                  return (
                    <article
                      key={`enroll_${c.id}`}
                      className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm overflow-hidden"
                    >
                      <div
                        className="absolute inset-x-0 top-0 h-1.5"
                        style={{ background: topStripe(diffRaw) }}
                        aria-hidden
                      />
                      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
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
                          className="inline-flex h-8 items-center justify-center rounded-xl border-2 px-3 text-xs font-medium transition transform hover:scale-[1.04] active:scale-[0.98]"
                          style={{
                            background: "#fff",
                            color: "var(--accent)",
                            borderColor: "var(--accent)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget.style.background =
                              "var(--accent)"),
                              (e.currentTarget.style.color = "#fff");
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget.style.background = "#fff"),
                              (e.currentTarget.style.color = "var(--accent)");
                          }}
                          title="Enroll"
                        >
                          + Test
                        </button>
                      </div>
                      <div className="min-w-0 pr-24 md:pr-28">
                        <h4 className="font-semibold leading-tight break-words -mt-0.5">
                          {title}
                        </h4>
                        {!!c.tags?.length && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {c.tags!.slice(0, 6).map((t) => (
                              <Tag key={t}>{t}</Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
                {availableForModal.length === 0 && (
                  <div className="text-sm text-[var(--muted)] px-1 py-8">
                    No competencies match your filters.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                onMouseEnter={(e) => {
                  if (!selectedTags.has(t)) {
                    e.currentTarget.style.background =
                      "color-mix(in oklab, var(--accent) 12%, transparent)";
                    e.currentTarget.style.borderColor =
                      "color-mix(in oklab, var(--accent) 28%, transparent)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedTags.has(t)) {
                    e.currentTarget.style.background = "var(--surface)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }
                }}
                className={[
                  "text-[10px] rounded-full border px-2 py-0.5 transition transform hover:scale-[1.03]",
                  selectedTags.has(t)
                    ? "text-white border-transparent"
                    : "text-[var(--foreground)]/80",
                ].join(" ")}
                style={{
                  background: selectedTags.has(t)
                    ? "var(--accent)"
                    : "var(--surface)",
                  borderColor: selectedTags.has(t)
                    ? "transparent"
                    : "var(--border)",
                }}
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
            {inProgressList.length} shown
          </div>
        </div>

        {loading && <div className="text-[var(--muted)]">Loading…</div>}
        {!loading && inProgressList.length === 0 && (
          <div className="text-[var(--muted)] text-sm">
            You’re not enrolled in any competencies matching these filters.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {inProgressList.map((c) => {
            const title = c.name ?? `Topic ${c.id.slice(0, 8)}…`;
            const diffRaw = (c.difficulty ?? "").trim();
            const p = progressByComp.get(c.id);
            const pct = Math.max(0, Math.min(100, Math.round(p?.pct ?? 0)));
            const hasQuestions =
              (p?.total_questions ?? 0) > 0 ||
              !!(c.test_question && c.test_question.trim().length);

            return (
              <article
                key={`enr_${c.id}`}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm min-h-[160px] overflow-hidden"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: topStripe(diffRaw) }}
                  aria-hidden
                />
                <div className="flex items-start gap-2">
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    {diffRaw && (
                      <span
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{ background: badgeBg(diffRaw), color: "#000" }}
                      >
                        {diffRaw}
                      </span>
                    )}
                    {hasQuestions && (
                      <ChevronAction
                        href={`/trainee/competency/${c.id}`}
                        variant="accent"
                        title="Open"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pr-24 md:pr-32">
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

      {/* Completed */}
      <section className="mx-auto max-w-6xl px-6 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">Completed</h2>
          <div className="text-xs text-[var(--muted)]">
            {completedList.length} shown
          </div>
        </div>

        {!loading && completedList.length === 0 && (
          <div className="text-[var(--muted)] text-sm">
            No completed competencies yet.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {completedList.map((c) => {
            const title = c.name ?? `Topic ${c.id.slice(0, 8)}…`;
            const diffRaw = (c.difficulty ?? "").trim();
            return (
              <article
                key={`done_${c.id}`}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm min-h-[140px] overflow-hidden"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: topStripe(diffRaw) }}
                  aria-hidden
                />
                <div className="flex items-start gap-2">
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    {diffRaw && (
                      <span
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{ background: badgeBg(diffRaw), color: "#000" }}
                      >
                        {diffRaw}
                      </span>
                    )}
                    <span
                      className="text-[10px] font-semibold rounded-full px-2 py-0.5 border"
                      style={{
                        background:
                          "color-mix(in oklab, var(--ok) 20%, transparent)",
                        borderColor:
                          "color-mix(in oklab, var(--ok) 40%, transparent)",
                        color: "var(--ok)",
                      }}
                      title="Completed"
                    >
                      Completed
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pr-24 md:pr-32">
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

      {/* Available Competencies — now shown in modal only */}
      {false && (
        <section className="mx-auto max-w-6xl px-6 pb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold">
              Available Competencies
            </h2>
            <div className="text-xs text-[var(--muted)]">
              {availableList.length} shown
            </div>
          </div>
          {/* (hidden) */}
        </section>
      )}
    </main>
  );
}

/* ---------- charts ---------- */

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

function getInitials(text: string) {
  const str = (text || "").trim();
  if (!str) return "U";
  const parts = str.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b || a).toUpperCase();
}

function formatNumber(n: number) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  const ring = color
    ? `0 0 0 4px color-mix(in oklab, ${color} 18%, transparent)`
    : "none";
  const valColor = color ? color : "inherit";
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: ring,
      }}
    >
      <div className="text-2xl font-semibold" style={{ color: valColor }}>
        {value}
      </div>
      <div className="text-xs text-[var(--muted)] mt-0.5">{label}</div>
    </div>
  );
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
  // Use provided difficulty color for hover when available, else fall back to accent
  const hoverBase = color ?? "var(--accent)";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!active) {
          (
            e.currentTarget as HTMLButtonElement
          ).style.background = `color-mix(in oklab, ${hoverBase} 12%, transparent)`;
          (
            e.currentTarget as HTMLButtonElement
          ).style.borderColor = `color-mix(in oklab, ${hoverBase} 28%, transparent)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--surface)";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border)";
        }
      }}
      className={[
        "px-3 py-1.5 rounded-full border text-xs font-medium transition transform",
        "hover:scale-[1.03]",
        active
          ? "shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_18%,transparent)]"
          : "",
      ].join(" ")}
      style={{
        borderColor: "var(--border)",
        background: active ? color ?? "var(--field)" : "var(--surface)",
        color: active ? "var(--foreground)" : "var(--foreground)",
      }}
    >
      {label}
    </button>
  );
}

function StatText({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-2xl font-semibold"
        style={{ color: color ?? "inherit" }}
      >
        {value}
      </span>
      <span className="text-xs md:text-sm text-[var(--muted)]">{label}</span>
    </div>
  );
}
