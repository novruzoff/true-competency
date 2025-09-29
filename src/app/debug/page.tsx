"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type DiagRow = {
  name: string;
  status: "ok" | "warn" | "error";
  detail?: string;
  extra?: unknown; // <-- allow User objects, arrays, etc.
};

type Profile = {
  id: string;
  display_name: string | null;
  role: "student" | "doctor";
};

const T = {
  CANVAS: "#0b0c0f",
  SURFACE: "#121418",
  BORDER: "#1f232a",
  TEXT: "#e6e7ea",
  MUTED: "#9aa0a6",
  OK: "#6ae6b2",
  WARN: "#facc15",
  ERR: "#fb7185",
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
      // 1) Env vars
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

      // 2) Auth session
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
          extra: userRes.user, // User object is fine now
        });
      }

      // 3) Current profile
      if (userRes?.user?.id) {
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("id, display_name, role")
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
            detail: `${prof.display_name ?? "(no name)"} • ${prof.role}`,
            extra: prof,
          });
        }
      }

      // 4) Count competencies
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

      // 5) Any rows in progress view
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

      // 6) Rows for current user
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

      // 7) Fetch competencies by ids from progress (join sanity)
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
    <main style={{ minHeight: "100vh", background: T.CANVAS, color: T.TEXT }}>
      <header style={{ borderBottom: `1px solid ${T.BORDER}` }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>
            Debug — Supabase connectivity
          </h1>
          <button
            onClick={run}
            disabled={running}
            style={{
              background: T.OK,
              color: "#0a0a0a",
              border: "none",
              padding: "8px 12px",
              borderRadius: 10,
              fontWeight: 600,
              opacity: running ? 0.6 : 1,
            }}
          >
            {running ? "Running…" : "Re-run checks"}
          </button>
        </div>
      </header>

      <section
        style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 24px" }}
      >
        <SummaryRow anyError={anyError} anyWarn={anyWarn} />

        <div style={{ display: "grid", gap: 10 }}>
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
  const color = anyError ? T.ERR : anyWarn ? T.WARN : T.OK;

  return (
    <div
      style={{
        background: T.SURFACE,
        border: `1px solid ${T.BORDER}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <strong style={{ color }}>{text}</strong>
      <div style={{ fontSize: 13, color: T.MUTED, marginTop: 4 }}>
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
  const color = status === "ok" ? T.OK : status === "warn" ? T.WARN : T.ERR;

  // Safe stringify for any value (User object, arrays, null, etc.)
  const json = useMemo(() => {
    try {
      return extra === undefined ? undefined : JSON.stringify(extra, null, 2);
    } catch {
      return String(extra);
    }
  }, [extra]);

  return (
    <div
      style={{
        background: T.SURFACE,
        border: `1px solid ${T.BORDER}`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 600 }}>{title}</div>
        <span
          style={{
            color: "#0a0a0a",
            background: color,
            borderRadius: 999,
            padding: "2px 8px",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {status.toUpperCase()}
        </span>
      </div>
      {detail && (
        <div style={{ marginTop: 6, fontSize: 13, color: T.MUTED }}>
          {detail}
        </div>
      )}
      {json !== undefined && (
        <pre
          style={{
            marginTop: 8,
            fontSize: 12,
            lineHeight: 1.4,
            color: T.TEXT,
            background: "#0e1014",
            border: `1px solid ${T.BORDER}`,
            borderRadius: 8,
            padding: 10,
            overflowX: "auto",
          }}
        >
          {json}
        </pre>
      )}
    </div>
  );
}
