"use client";
import { useEffect, useState } from "react";

type Health = { ok: boolean; time: string };
type Runtime = { env: Record<string, boolean>; node: string };

export default function PreviewCheck() {
  const [health, setHealth] = useState<Health | null>(null);
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [h, r] = await Promise.all([
          fetch("/api/health").then((r) => r.json()),
          fetch("/api/runtime").then((r) => r.json()),
        ]);
        setHealth(h);
        setRuntime(r);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to fetch diagnostics");
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 10 }}>Preview Diagnostics</h1>

      {err && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#fee2e2",
            color: "#7f1d1d",
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}

      <section
        style={{
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          marginBottom: 12,
          background: "#fff",
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Health</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      </section>

      <section
        style={{
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Runtime Env Presence</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(runtime, null, 2)}
        </pre>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
          Any <code>false</code> means that env var is missing in your Vercel{" "}
          <strong>Preview</strong> environment.
        </p>
      </section>
    </div>
  );
}
