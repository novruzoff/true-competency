"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// --- Minimal client in-file so you can paste this as a single file ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// --- Types matching your table ---
type Competency = {
  id: string;
  name: string;
  difficulty: string; // text with your CHECK or freeform
  tags: string[]; // text[]
  test_question: string | null;
  created_at: string;
};

const DIFFICULTIES = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
] as const;

export default function DashboardPage() {
  // Auth (optional UI nicety)
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Data + UI state
  const [items, setItems] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState<string>(""); // blank = all
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);

  // Debounce search
  const qRef = useRef(q);
  useEffect(() => {
    qRef.current = q;
  }, [q]);

  const debouncedQ = useDebouncedValue(q, 300);

  // Load user (optional)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
    })();
  }, []);

  // Fetch data whenever filters/page change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from("competencies")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (debouncedQ.trim()) {
          // Case-insensitive LIKE on name
          query = query.ilike("name", `%${debouncedQ.trim()}%`);
        }

        if (difficulty) {
          query = query.eq("difficulty", difficulty);
        }

        if (selectedTags.length > 0) {
          // Supabase Postgres array contains: ALL of these tags must be present
          // If you want ANY tag match, loop and OR on the client side with a filter after.
          query = query.contains("tags", selectedTags);
        }

        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;
        if (cancelled) return;

        setItems((data ?? []) as Competency[]);
        setTotal(count ?? 0);
      } catch (e: any) {
        if (!cancelled) setErr(e.message ?? "Failed to load data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQ, difficulty, selectedTags, page, pageSize]);

  // Aggregate popular tags from the current page (for quick chips)
  const pageTagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((it) => {
      (it.tags ?? []).forEach((t) => counts.set(t, 1 + (counts.get(t) ?? 0)));
    });
    // Sort by frequency desc, then by name
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 20);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function toggleTag(tag: string) {
    setPage(1);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addTagFromInput() {
    const t = normalizeTag(tagInput);
    if (!t) return;
    if (!selectedTags.includes(t)) {
      setSelectedTags([...selectedTags, t]);
      setPage(1);
    }
    setTagInput("");
  }

  function clearAllFilters() {
    setQ("");
    setDifficulty("");
    setSelectedTags([]);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-neutral-800 grid place-items-center text-sm font-bold">
              TC
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">
                True Competency — Dashboard
              </h1>
              <p className="text-xs text-neutral-400">
                Browse and filter IVUS competencies
              </p>
            </div>
          </div>
          <div className="text-sm text-neutral-400">
            {userEmail ? `Signed in as ${userEmail}` : "Not signed in"}
          </div>
        </div>
      </header>

      {/* Controls */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Search */}
          <div className="lg:col-span-5">
            <label className="text-xs uppercase tracking-wide text-neutral-400">
              Search
            </label>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name…"
              className="mt-1 w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2.5 outline-none focus:border-neutral-600"
            />
          </div>

          {/* Difficulty */}
          <div className="lg:col-span-3">
            <label className="text-xs uppercase tracking-wide text-neutral-400">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2.5 outline-none focus:border-neutral-600"
            >
              <option value="">All</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Tag input */}
          <div className="lg:col-span-4">
            <label className="text-xs uppercase tracking-wide text-neutral-400">
              Filter by tag
            </label>
            <div className="mt-1 flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. #IVUS"
                className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2.5 outline-none focus:border-neutral-600"
              />
              <button
                onClick={addTagFromInput}
                className="rounded-xl bg-neutral-100 text-neutral-900 px-4 py-2.5 text-sm font-medium hover:bg-white/90"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selectedTags.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs hover:border-neutral-500"
                title="Click to remove"
              >
                {t} ×
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-neutral-400 hover:text-neutral-200 underline underline-offset-4"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Tag chips from current page */}
        {pageTagCounts.length > 0 && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
              Popular tags on this page
            </div>
            <div className="flex flex-wrap gap-2">
              {pageTagCounts.map(([t, n]) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    selectedTags.includes(t)
                      ? "border-neutral-200 bg-neutral-100 text-neutral-900"
                      : "border-neutral-700 bg-neutral-900 hover:border-neutral-500"
                  }`}
                >
                  {t} <span className="opacity-60">({n})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        {/* Top bar: count + page size */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-neutral-400">
            {loading ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}
            {debouncedQ || difficulty || selectedTags.length
              ? " • filters active"
              : ""}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg bg-neutral-900 border border-neutral-800 px-2 py-1.5 text-sm outline-none"
            >
              {[6, 12, 24, 48].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-4 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: pageSize }).map((_, i) => (
                <CardSkeleton key={i} />
              ))
            : items.map((it) => <CompetencyCard key={it.id} item={it} />)}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-neutral-400">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}

// -- Components ------------------------------------------------------------

function CompetencyCard({ item }: { item: Competency }) {
  return (
    <article className="group rounded-2xl border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600 transition">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-medium leading-tight">{item.name}</h3>
        <span className="rounded-full bg-neutral-100 text-neutral-900 text-xs px-2 py-1 font-semibold">
          {item.difficulty}
        </span>
      </div>

      {/* Tags */}
      {item.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200"
            >
              {t}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-neutral-500 italic">No tags</p>
      )}

      {/* Placeholder for future: test question */}
      <div className="mt-4 rounded-xl bg-neutral-950/40 border border-neutral-800 p-3">
        <p className="text-xs text-neutral-400">Test question</p>
        <p className="text-sm text-neutral-300 mt-1">
          {item.test_question ? item.test_question : "—"}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
        <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
        <button className="opacity-70 hover:opacity-100">Details →</button>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 animate-pulse">
      <div className="h-5 w-2/3 rounded bg-neutral-800" />
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-neutral-800" />
        <div className="h-6 w-12 rounded-full bg-neutral-800" />
      </div>
      <div className="mt-4 h-16 rounded bg-neutral-800" />
      <div className="mt-4 h-4 w-1/3 rounded bg-neutral-800" />
    </div>
  );
}

// -- Hooks & utils ---------------------------------------------------------

function useDebouncedValue<T>(value: T, delay: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function normalizeTag(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  return t.startsWith("#") ? t : `#${t}`;
}
