// src/app/debug/DebugClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type DiagRow = {
  name: string;
  status: "ok" | "warn" | "error";
  detail?: string;
  extra?: unknown;
};

type Profile = {
  id: string;
  email: string | null;
  role: "trainee" | "instructor" | "committee";
};

/* Theme tokens */
const ACCENT = "var(--accent)";
const SURFACE = "var(--surface)";
const BORDER = "var(--border)";
const FG = "var(--foreground)";
const MUTED = "var(--muted)";

const COLORS = {
  OK: "#10b981",
  WARN: "#f59e0b",
  ERR: "#ef4444",
};

export default function DebugClient() {
  const [rows, setRows] = useState<DiagRow[]>([]);
  const [running, setRunning] = useState(false);

  const add = useCallback((r: DiagRow) => setRows((prev) => [...prev, r]), []);
  const reset = useCallback(() => setRows([]), []);

  const run = useCallback(async () => {
    reset();
    setRunning(true);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      add({
        name: "env:NEXT_PUBLIC_SUPABASE_URL",
        status: url ? "ok" : "error",
        detail: url || "Missing",
      });
      add({
        name: "env:NEXT_PUBLIC_SUPABASE_ANON_KEY",
        status: anon ? "ok" : "error",
        detail: anon ? "Present" : "Missing",
      });

      if (!url || !anon) {
        add({
          name: "client",
          status: "error",
          detail: "Supabase client cannot initialize without env vars.",
        });
        setRunning(false);
        return;
      }

      const { data: userRes, error: getUserErr } =
        await supabase.auth.getUser();
      if (getUserErr) {
        add({
          name: "auth.getUser",
          status: "error",
          detail: getUserErr.message,
        });
      } else {
        add({
          name: "auth.getUser",
          status: userRes.user ? "ok" : "warn",
          detail: userRes.user
            ? `Signed in as ${userRes.user.email}`
            : "No session",
          extra: userRes.user,
        });
      }

      if (userRes?.user?.id) {
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("id, email, role")
          .eq("id", userRes.user.id)
          .single<Profile>();

        if (profErr) {
          add({
            name: "profiles (current user)",
            status: "error",
            detail: profErr.message,
          });
        } else {
          add({
            name: "profiles (current user)",
            status: "ok",
            detail: `${prof.email ?? "(no email)"} • ${prof.role}`,
            extra: prof,
          });
        }
      }

      {
        const { count, error } = await supabase
          .from("competencies")
          .select("*", { count: "exact", head: true });
        if (error)
          add({
            name: "competencies count",
            status: "error",
            detail: error.message,
          });
        else if ((count ?? 0) === 0)
          add({
            name: "competencies count",
            status: "warn",
            detail: "0 rows (empty or RLS)",
          });
        else
          add({
            name: "competencies count",
            status: "ok",
            detail: String(count),
          });
      }

      {
        const { data, error } = await supabase
          .from("student_competency_progress")
          .select("student_id, competency_id")
          .limit(3);
        if (error)
          add({
            name: "student_competency_progress (any rows)",
            status: "error",
            detail: error.message,
          });
        else if (!data || data.length === 0)
          add({
            name: "student_competency_progress (any rows)",
            status: "warn",
            detail: "0 rows",
          });
        else
          add({
            name: "student_competency_progress (any rows)",
            status: "ok",
            detail: `${data.length} sample row(s)`,
            extra: data,
          });
      }

      if (userRes?.user?.id) {
        const { data: scp, error: scpErr } = await supabase
          .from("student_competency_progress")
          .select(
            "student_id, competency_id, total_questions, answered_questions, pct"
          )
          .eq("student_id", userRes.user.id)
          .order("pct", { ascending: true })
          .limit(5);

        if (scpErr)
          add({
            name: "student_competency_progress (for current user)",
            status: "error",
            detail: scpErr.message,
          });
        else if (!scp || scp.length === 0)
          add({
            name: "student_competency_progress (for current user)",
            status: "warn",
            detail: "0 rows (no assignments or RLS)",
          });
        else
          add({
            name: "student_competency_progress (for current user)",
            status: "ok",
            detail: `${scp.length} row(s)`,
            extra: scp,
          });
      }

      {
        const { data: p } = await supabase
          .from("student_competency_progress")
          .select("competency_id")
          .limit(3);
        const ids = (p ?? []).map(
          (r: { competency_id: string }) => r.competency_id
        );
        if (ids.length) {
          const { data: comps, error } = await supabase
            .from("competencies")
            .select("id, name, difficulty, tags")
            .in("id", ids);
          if (error)
            add({
              name: "competencies (by ids from progress)",
              status: "error",
              detail: error.message,
            });
          else
            add({
              name: "competencies (by ids from progress)",
              status: "ok",
              detail: `${comps?.length ?? 0} row(s)`,
              extra: comps,
            });
        } else {
          add({
            name: "competencies (by ids from progress)",
            status: "warn",
            detail: "Skipped: no progress rows.",
          });
        }
      }
    } catch (e) {
      add({
        name: "unexpected",
        status: "error",
        detail: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setRunning(false);
    }
  }, [reset, add, supabase]);

  useEffect(() => {
    run();
  }, [run]);

  // Derived state
  const anyError = useMemo(
    () => rows.some((r) => r.status === "error"),
    [rows]
  );
  const anyWarn = useMemo(() => rows.some((r) => r.status === "warn"), [rows]);

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      {/* Page title */}
      <section className="mx-auto max-w-5xl px-6 pt-8 pb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Debug — Supabase connectivity
        </h1>
        <div className="accent-underline mt-3" />
        <p className="mt-2 text-sm md:text-base" style={{ color: MUTED }}>
          Quick end-to-end checks for auth session and read access via RLS.
        </p>

        <div className="mt-4">
          <button
            onClick={run}
            disabled={running}
            className="rounded-2xl px-4 py-2 text-sm font-semibold btn-primary transition-colors disabled:opacity-60"
            style={{
              background: ACCENT,
              color: "#fff",
              boxShadow:
                "0 8px 30px color-mix(in oklab, var(--accent) 25%, transparent)",
            }}
          >
            {running ? "Running…" : "Re-run checks"}
          </button>
        </div>
      </section>

      <hr
        className="border-0 h-[1px] mx-auto max-w-5xl"
        style={{
          background: `color-mix(in oklab, ${ACCENT} 20%, transparent)`,
        }}
      />

      {/* Summary + Cards */}
      <section className="mx-auto max-w-5xl px-6 py-6">
        <SummaryRow anyError={anyError} anyWarn={anyWarn} />
        <div className="grid gap-3">
          {rows.map((r, i) => (
            <Card
              key={i}
              title={r.name}
              status={r.status}
              detail={r.detail}
              extra={r.extra}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function SummaryRow({
  anyError,
  anyWarn,
}: {
  anyError: boolean;
  anyWarn: boolean;
}) {
  const text = anyError
    ? "Errors detected — see below"
    : anyWarn
    ? "Warnings detected — see below"
    : "All checks passed";
  const border = anyError ? COLORS.ERR : anyWarn ? COLORS.WARN : COLORS.OK;

  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderLeft: `4px solid ${border}`,
      }}
    >
      <strong className="block" style={{ color: border }}>
        {text}
      </strong>
      <div className="mt-1 text-sm" style={{ color: MUTED }}>
        This page only reads from Supabase. No writes or schema changes.
      </div>
    </div>
  );
}

function Card({
  title,
  status,
  detail,
  extra,
}: {
  title: string;
  status: "ok" | "warn" | "error";
  detail?: string;
  extra?: unknown;
}) {
  const pillBg =
    status === "ok" ? COLORS.OK : status === "warn" ? COLORS.WARN : COLORS.ERR;

  const json = useMemo(() => {
    try {
      return extra === undefined ? undefined : JSON.stringify(extra, null, 2);
    } catch {
      return String(extra);
    }
  }, [extra]);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold" style={{ color: FG }}>
          {title}
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
          style={{ background: pillBg }}
        >
          {status.toUpperCase()}
        </span>
      </div>

      {detail && (
        <div className="mt-2 text-sm" style={{ color: MUTED }}>
          {detail}
        </div>
      )}

      {json !== undefined && (
        <pre
          className="mt-3 text-xs leading-relaxed rounded-lg p-3 overflow-x-auto"
          style={{
            color: FG,
            background:
              "color-mix(in oklab, var(--background) 92%, transparent)",
            border: `1px solid ${BORDER}`,
          }}
        >
          {json}
        </pre>
      )}
    </div>
  );
}
