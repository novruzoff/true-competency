// src/app/committee/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "next-themes";

// TYPES
type Competency = {
  id: string;
  name: string;
  difficulty: string;
  tags: string[] | null;
  created_at: string;
};

type SuggestedCompetency = {
  id: string; // from competencies_stage
  name: string;
  difficulty: string;
  tags: string[] | null;
  justification: string | null;
  created_at?: string | null;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

const DIFF_ORDER = ["Beginner", "Intermediate", "Expert"] as const;

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function diffVar(d: string): string {
  const v = d.toLowerCase();
  if (v === "beginner") return "var(--ok)";
  if (v === "intermediate") return "var(--warn)";
  if (v === "expert") return "var(--err)";
  return "var(--border)";
}

export default function CommitteeHome() {
  const { resolvedTheme } = useTheme();
  const [me, setMe] = useState<Profile | null>(null);
  const tcipLogoSrc =
    resolvedTheme === "dark" ? "/TCIP_White_Logo.png" : "/TCIP_Black_Logo.png";

  // data
  const [rows, setRows] = useState<Competency[]>([]);
  const [suggested, setSuggested] = useState<SuggestedCompetency[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, boolean>>({}); // key: stage_id
  const [voteCounts, setVoteCounts] = useState<
    Record<string, { forCount: number; againstCount: number }>
  >({});

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [query, setQuery] = useState("");
  const [tagFilters, setTagFilters] = useState<string[]>([]);

  // tabs: all vs suggested
  const [activeTab, setActiveTab] = useState<"all" | "suggested">("all");

  // propose modal
  const [proposeOpen, setProposeOpen] = useState(false);
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] =
    useState<(typeof DIFF_ORDER)[number]>("Intermediate");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [proposeReason, setProposeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // LOAD DATA
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const { data: u, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        let myProfile: Profile | null = null;
        if (u.user?.id) {
          const { data: prof, error: pErr } = await supabase
            .from("profiles")
            .select(
              "id, first_name, last_name, full_name, email, role, country_name, country_code"
            )
            .eq("id", u.user.id)
            .maybeSingle<
              Profile & {
                country_name?: string | null;
                country_code?: string | null;
              }
            >();
          if (pErr) throw pErr;
          if (prof) {
            // weave country into name if missing
            myProfile = {
              id: prof.id,
              first_name: prof.first_name,
              last_name: prof.last_name,
              full_name: prof.full_name,
              email: prof.email,
              role: prof.role,
            };
          }
        }
        if (!cancelled) setMe(myProfile);

        // all competencies
        const { data: comps, error: cErr } = await supabase
          .from("competencies")
          .select("id, name, difficulty, tags, created_at")
          .order("created_at", { ascending: false });
        if (cErr) throw cErr;
        if (!cancelled) setRows((comps ?? []) as Competency[]);

        // suggested competencies
        const { data: sug, error: sErr } = await supabase
          .from("competencies_stage")
          .select("id, name, difficulty, tags, justification")
          .order("name", { ascending: true });
        if (sErr) throw sErr;
        if (!cancelled) setSuggested((sug ?? []) as SuggestedCompetency[]);

        // committee votes: my votes + aggregate counts
        const { data: votes, error: vErr } = await supabase
          .from("committee_votes")
          .select("stage_id, voter_id, vote");
        if (vErr) throw vErr;

        const myMap: Record<string, boolean> = {};
        const countsMap: Record<
          string,
          { forCount: number; againstCount: number }
        > = {};

        (votes ?? []).forEach(
          (v: { stage_id: string; voter_id: string; vote: boolean }) => {
            if (!countsMap[v.stage_id]) {
              countsMap[v.stage_id] = { forCount: 0, againstCount: 0 };
            }
            if (v.vote) {
              countsMap[v.stage_id].forCount += 1;
            } else {
              countsMap[v.stage_id].againstCount += 1;
            }
            if (v.voter_id === u.user?.id) {
              myMap[v.stage_id] = v.vote;
            }
          }
        );

        if (!cancelled) {
          setMyVotes(myMap);
          setVoteCounts(countsMap);
        }
      } catch (e) {
        if (!cancelled)
          setErr(
            e instanceof Error
              ? e.message
              : typeof e === "object"
              ? JSON.stringify(e)
              : String(e)
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const welcome = useMemo(() => {
    if (!me) return "Welcome back";
    const last = me.last_name || me.full_name?.split(" ").slice(-1)[0] || null;
    return last ? `Welcome back, Dr. ${last}` : "Welcome back";
  }, [me]);

  // collect tags from main list (used for filters + propose selectable)
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) (r.tags ?? []).forEach((t) => set.add(t));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // filtered main list
  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const inSearch =
        !needle ||
        r.name.toLowerCase().includes(needle) ||
        r.difficulty.toLowerCase().includes(needle) ||
        (r.tags ?? []).some((t) => t.toLowerCase().includes(needle));
      const tags = r.tags ?? [];
      const tagsOk =
        tagFilters.length === 0 ||
        tagFilters.every((t) =>
          tags.map((x) => x.toLowerCase()).includes(t.toLowerCase())
        );
      return inSearch && tagsOk;
    });
    const order = (d: string) => {
      const v = d.toLowerCase();
      if (v === "beginner") return 0;
      if (v === "intermediate") return 1;
      if (v === "expert") return 2;
      return 3;
    };
    return [...filtered].sort((a, b) => {
      const da = order(a.difficulty);
      const db = order(b.difficulty);
      if (da !== db) return da - db;
      return a.name.localeCompare(b.name);
    });
  }, [rows, query, tagFilters]);

  // filtered suggested list
  const suggestedFiltered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return suggested.filter((r) => {
      const inSearch =
        !needle ||
        r.name.toLowerCase().includes(needle) ||
        r.difficulty.toLowerCase().includes(needle) ||
        (r.tags ?? []).some((t) => t.toLowerCase().includes(needle));
      const tags = r.tags ?? [];
      const tagsOk =
        tagFilters.length === 0 ||
        tagFilters.every((t) =>
          tags.map((x) => x.toLowerCase()).includes(t.toLowerCase())
        );
      return inSearch && tagsOk;
    });
  }, [suggested, query, tagFilters]);

  function toggleTag(tag: string) {
    setTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }
  function clearFilters() {
    setQuery("");
    setTagFilters([]);
  }

  async function handleVote(stageId: string, value: boolean) {
    if (!me?.id) return;
    try {
      const { error } = await supabase.from("committee_votes").upsert(
        {
          stage_id: stageId,
          voter_id: me.id,
          vote: value,
        },
        { onConflict: "stage_id,voter_id" }
      );
      if (error) throw error;

      // update my vote
      setMyVotes((prev) => ({ ...prev, [stageId]: value }));

      // update aggregate counts
      setVoteCounts((prev) => {
        const existing = prev[stageId] ?? { forCount: 0, againstCount: 0 };
        const prevVote = myVotes[stageId];
        let forCount = existing.forCount;
        let againstCount = existing.againstCount;

        if (prevVote === true) {
          forCount = Math.max(0, forCount - 1);
        } else if (prevVote === false) {
          againstCount = Math.max(0, againstCount - 1);
        }

        if (value === true) {
          forCount += 1;
        } else {
          againstCount += 1;
        }

        return {
          ...prev,
          [stageId]: { forCount, againstCount },
        };
      });
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : typeof e === "object"
          ? JSON.stringify(e)
          : String(e)
      );
    }
  }

  async function handlePropose() {
    try {
      setSubmitting(true);
      setErr(null);
      const nameTrim = name.trim();
      if (!nameTrim) throw new Error("Please enter a competency name.");
      const { error } = await supabase.from("competencies_stage").insert({
        name: nameTrim,
        difficulty,
        tags: selectedTags,
        justification: proposeReason.trim() || null,
      });
      if (error) throw error;
      setProposeOpen(false);
      setName("");
      setSelectedTags([]);
      setDifficulty("Intermediate");
      setProposeReason("");
      setToast("Proposal submitted for review.");
      setTimeout(() => setToast(null), 2200);
      // refresh suggested list
      const { data: sug } = await supabase
        .from("competencies_stage")
        .select("id, name, difficulty, tags, justification")
        .order("name", { ascending: true });
      setSuggested((sug ?? []) as SuggestedCompetency[]);
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : typeof e === "object"
          ? JSON.stringify(e)
          : String(e)
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {welcome}
            </h1>
            <div className="accent-underline mt-3" />
            <div className="mt-4 flex items-center gap-5">
              <img
                src="/APSC_Logo.png"
                alt="Asian Pacific Society of Cardiology logo"
                className="h-20 w-auto object-contain"
              />
              <img
                src={tcipLogoSrc}
                alt="TCIP logo"
                className="h-20 w-auto object-contain"
              />
            </div>
            <p className="mt-2 text-sm md:text-base text-[var(--muted)]">
              Asia Pacific Society of Cardiology TCIP IVUS Course
            </p>
          </div>

          <button
            onClick={() => setProposeOpen(true)}
            className="rounded-xl px-3 py-2 text-sm text-white transition-transform duration-500 ease-out hover:scale-[1.05] hover:shadow-[0_0_12px_var(--accent)]"
            style={{ background: "var(--accent)" }}
            title="Propose a new competency"
          >
            Propose competency
          </button>
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-6xl px-6 pb-4">
        <div className="mb-3 flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search (name, difficulty, tag)…"
            className="flex-grow rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm outline-none min-w-0 h-[40px]"
          />
          <button
            onClick={clearFilters}
            className="h-[40px] whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"
          >
            Clear all
          </button>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={cls(
                  "rounded-full px-2 py-0.5 text-[11px] border transition",
                  tagFilters.includes(t)
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--field)] text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* tabs */}
        <div className="flex justify-center gap-8 border-b border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cls(
              "pb-2 text-sm font-medium transition-colors",
              activeTab === "all"
                ? "text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <div className="flex flex-col items-center">
              <span>All competencies</span>
              {activeTab === "all" && (
                <div
                  className="accent-underline mt-2"
                  style={{ width: "120%" }}
                />
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("suggested")}
            className={cls(
              "pb-2 text-sm font-medium transition-colors",
              activeTab === "suggested"
                ? "text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <div className="flex flex-col items-center">
              <span>Suggested competencies</span>
              {activeTab === "suggested" && (
                <div
                  className="accent-underline mt-2"
                  style={{ width: "120%" }}
                />
              )}
            </div>
          </button>
        </div>
      </section>

      {/* BODY */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        {loading && <div className="text-[var(--muted)]">Loading…</div>}
        {err && (
          <div className="mb-3 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {!loading && activeTab === "all" && (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--field)]/40">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    Difficulty
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    Tags
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="border-t border-[var(--border)] hover:bg-[color:var(--accent)]/3 transition-colors"
                  >
                    <td className="px-3 py-2 align-middle text-xs text-[var(--muted)] w-12">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 align-middle font-medium text-[var(--foreground)]">
                      {c.name}
                    </td>
                    <td className="px-3 py-2 align-middle w-36">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          background: diffVar(c.difficulty),
                          color: "#000",
                        }}
                      >
                        {c.difficulty}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {c.tags && c.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-[360px]">
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-[var(--border)] bg-[var(--field)] px-2 py-0.5 text-[11px] text-[var(--muted)]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[var(--muted)] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle text-xs text-[var(--muted)] whitespace-nowrap w-36">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === "suggested" && (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--field)]/40">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    Difficulty
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    Tags
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    Justification
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    Vote
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">
                    Votes
                  </th>
                </tr>
              </thead>
              <tbody>
                {suggestedFiltered.map((c, idx) => {
                  const vote = myVotes[c.id];
                  return (
                    <tr
                      key={c.id}
                      className="border-t border-[var(--border)] hover:bg-[color:var(--accent)]/3 transition-colors"
                    >
                      <td className="px-3 py-2 align-middle text-xs text-[var(--muted)] w-12">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 align-middle font-medium text-[var(--foreground)]">
                        {c.name}
                      </td>
                      <td className="px-3 py-2 align-middle w-32">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            background: diffVar(c.difficulty),
                            color: "#000",
                          }}
                        >
                          {c.difficulty}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        {c.tags && c.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                            {c.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full border border-[var(--border)] bg-[var(--field)] px-2 py-0.5 text-[11px] text-[var(--muted)]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[var(--muted)] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-[var(--muted)] max-w-[300px]">
                        {c.justification ?? "—"}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVote(c.id, true)}
                            className={cls(
                              "h-8 w-8 rounded-full grid place-items-center text-white transition",
                              vote === true
                                ? "bg-[var(--ok)]"
                                : "bg-[var(--ok)]/40 hover:bg-[var(--ok)]"
                            )}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleVote(c.id, false)}
                            className={cls(
                              "h-8 w-8 rounded-full grid place-items-center text-white transition",
                              vote === false
                                ? "bg-[var(--err)]"
                                : "bg-[var(--err)]/40 hover:bg-[var(--err)]"
                            )}
                            title="Reject"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-[var(--muted)] whitespace-nowrap w-32">
                        {(() => {
                          const counts = voteCounts[c.id] ?? {
                            forCount: 0,
                            againstCount: 0,
                          };
                          return (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[var(--ok)]">
                                ✓ {counts.forCount}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[var(--err)]">
                                ✕ {counts.againstCount}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Propose modal */}
      {proposeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setProposeOpen(false)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-4 md:p-5 md:max-w-xl"
          >
            <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Propose a new competency
              </h3>
              <button
                onClick={() => setProposeOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] bg-[var(--field)]"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-[var(--muted)]">Name *</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., IVUS interpretation for calcified lesions"
                  className="rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm outline-none"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-[var(--muted)]">
                  Suggested difficulty *
                </span>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as (typeof DIFF_ORDER)[number])
                  }
                  className="rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm outline-none"
                >
                  {DIFF_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-1 text-sm">
                <span className="text-[var(--muted)]">Suggested tags</span>
                {allTags.length === 0 ? (
                  <div className="text-[var(--muted)] text-sm">
                    No existing tags yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((t) => {
                      const active = selectedTags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setSelectedTags((prev) =>
                              active
                                ? prev.filter((x) => x !== t)
                                : [...prev, t]
                            )
                          }
                          className={cls(
                            "rounded-full px-2 py-0.5 text-[11px] border transition",
                            active
                              ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-[var(--accent)]"
                              : "border-[var(--border)] bg-[var(--field)] text-[var(--muted)] hover:text-[var(--foreground)]"
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedTags.length > 0 && (
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Selected: {selectedTags.join(", ")}
                  </div>
                )}
              </div>
              <label className="grid gap-1 text-sm">
                <span className="text-[var(--muted)]">
                  Why do you think this competency should be added?
                </span>
                <textarea
                  value={proposeReason}
                  onChange={(e) => setProposeReason(e.target.value)}
                  placeholder="You can also suggest new tags if existing ones do not cover the competency well."
                  className="rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm outline-none min-h-[64px] resize-vertical"
                  rows={3}
                />
              </label>
              <div className="mt-1 flex justify-end gap-2">
                <button
                  onClick={() => setProposeOpen(false)}
                  className="rounded-xl border border-[var(--err)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--err)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePropose}
                  disabled={submitting}
                  className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit proposal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 grid place-items-center">
          <div
            role="status"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px[3] py-2 text-sm shadow-lg"
          >
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}
