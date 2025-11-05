// src/app/committee/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Committee Dashboard (aligned with Instructor/Trainee UI)
 * - Header/typography matches other dashboards
 * - Shows ALL competencies at once, sorted by difficulty (no section headers)
 * - Each card has a top color bar based on difficulty using CSS vars:
 *     Beginner → var(--ok), Intermediate → var(--warn), Expert → var(--err), Other → var(--border)
 * - Difficulty pill remains (tinted to same color)
 * - Tag filters + search (like trainee dashboard) with one-line "Clear all" button
 * - "Propose competency" modal with selectable tags from existing tag universe
 */

type Competency = {
  id: string;
  name: string;
  difficulty: string;
  tags: string[] | null;
  created_at: string;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

const DIFF_ORDER = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
type Difficulty = (typeof DIFF_ORDER)[number];

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function diffVar(d: string): string {
  const v = d.toLowerCase();
  if (v === "beginner") return "var(--ok)";
  if (v === "intermediate") return "var(--warn)";
  if (v === "expert") return "var(--err)";
  if (v === "advanced") return "var(--warn)"; // map Advanced ~ warn tier
  return "var(--border)"; // other/unknown
}

/** Difficulty pill — solid background (uses globals.css vars) with black text */
function DifficultyPill({ value }: { value: string }) {
  const bg = diffVar(value);
  return (
    <span
      className={cls(
        "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
      )}
      style={{
        background: bg,
        color: "#000", // black text for readability in both themes
      }}
    >
      {value}
    </span>
  );
}

function TagPill({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "rounded-full px-2 py-0.5 text-[11px]",
        "border transition inline-flex items-center",
        active
          ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-[var(--accent)]"
          : "border-[var(--border)] bg-[var(--field)] text-[var(--muted)] hover:text-[var(--foreground)]"
      )}
    >
      {label}
    </button>
  );
}

function Modal({
  open,
  onClose,
  title,
  widthClass = "md:max-w-2xl",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  widthClass?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cls(
          "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl",
          "p-4 md:p-5",
          widthClass
        )}
      >
        <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-base font-semibold text-[var(--foreground)]">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] bg-[var(--field)]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function CommitteeHome() {
  // me
  const [me, setMe] = useState<Profile | null>(null);

  // data
  const [rows, setRows] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [query, setQuery] = useState("");
  const [tagFilters, setTagFilters] = useState<string[]>([]);

  // propose modal
  const [proposeOpen, setProposeOpen] = useState(false);
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const { data: u, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        if (u.user?.id) {
          const { data: prof, error: pErr } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, full_name, email, role")
            .eq("id", u.user.id)
            .maybeSingle<Profile>();
          if (pErr) throw pErr;
          if (!cancelled) setMe(prof ?? null);
        }

        const { data, error } = await supabase
          .from("competencies")
          .select("id, name, difficulty, tags, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;

        if (!cancelled) setRows((data ?? []) as Competency[]);
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
  }, []);

  const welcome = useMemo(() => {
    if (!me) return "Welcome back";
    const last =
      me.last_name ??
      (me.full_name ? me.full_name.split(" ").slice(-1)[0] : null);
    return last ? `Welcome back, Dr. ${last}` : "Welcome back";
  }, [me]);

  // collect all tags (stable, sorted)
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) (r.tags ?? []).forEach((t) => set.add(t));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // filtered + sorted (by difficulty tier then by name)
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
      if (v === "advanced") return 2;
      if (v === "expert") return 3;
      return 4;
    };

    return [...filtered].sort((a, b) => {
      const da = order(a.difficulty);
      const db = order(b.difficulty);
      if (da !== db) return da - db;
      return a.name.localeCompare(b.name);
    });
  }, [rows, query, tagFilters]);

  function toggleTag(tag: string) {
    setTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }
  function clearFilters() {
    setQuery("");
    setTagFilters([]);
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
      });
      if (error) throw error;

      setProposeOpen(false);
      setName("");
      setSelectedTags([]);
      setDifficulty("Intermediate");

      setToast("Proposal submitted for review.");
      setTimeout(() => setToast(null), 2200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
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
            className="flex-grow rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm outline-none min-w-0"
            style={{ height: "40px" }}
          />
          <button
            onClick={clearFilters}
            className="h-[40px] whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"
          >
            Clear all
          </button>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((t) => (
              <TagPill
                key={t}
                label={t}
                active={tagFilters.includes(t)}
                onClick={() => toggleTag(t)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Body: flat grid, no difficulty headers; now as excel-style table */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        {loading && <div className="text-[var(--muted)]">Loading…</div>}
        {err && (
          <div className="mb-3 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {!loading && (
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
      </section>

      {/* Propose-competency modal */}
      <Modal
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        title="Propose a new competency"
        widthClass="md:max-w-xl"
      >
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
            <span className="text-[var(--muted)]">Suggested difficulty *</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
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
                          active ? prev.filter((x) => x !== t) : [...prev, t]
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

          <div className="mt-1 flex justify-end gap-2">
            <button
              onClick={() => setProposeOpen(false)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
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
      </Modal>

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
