// src/app/debug/page.tsx
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

const COLORS = {
  BLUE: "#5170ff",
  OK: "#10b981", // keep green
  WARN: "#f59e0b", // keep amber
  ERR: "#ef4444", // keep red
};

export default function DebugPage() {
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
  }, [reset, add]);

  useEffect(() => {
    run();
  }, [run]);

  const anyError = useMemo(
    () => rows.some((r) => r.status === "error"),
    [rows]
  );
  const anyWarn = useMemo(() => rows.some((r) => r.status === "warn"), [rows]);

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            Debug — Supabase connectivity
          </h1>

          {/* Force white text regardless of inherited styles */}
          <button
            onClick={run}
            disabled={running}
            className="rounded-2xl px-4 py-2 text-sm font-semibold bg-[#5170ff] !text-white 
                       shadow-[0_8px_30px_rgba(81,112,255,0.25)]
                       hover:bg-[#3e5deb] active:bg-[#3654d6]
                       transition-colors disabled:opacity-60"
            style={{ color: "#fff" }}
          >
            <span className="!text-white">
              {running ? "Running…" : "Re-run checks"}
            </span>
          </button>
        </div>
      </header>

      {/* Summary */}
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
      className="rounded-xl bg-white border p-3"
      style={{ borderColor: border, borderLeftWidth: 4 }}
    >
      <strong className="block" style={{ color: border }}>
        {text}
      </strong>
      <div className="mt-1 text-sm text-gray-600">
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
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">{title}</div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
          style={{ background: pillBg }}
        >
          {status.toUpperCase()}
        </span>
      </div>

      {detail && <div className="mt-2 text-sm text-gray-600">{detail}</div>}

      {json !== undefined && (
        <pre className="mt-3 text-xs leading-relaxed text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto">
          {json}
        </pre>
      )}
    </div>
  );
}
