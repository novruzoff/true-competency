"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const T = {
  BG: "#0b0c0f",
  SUR: "#121418",
  BR: "#1f232a",
  TX: "#e6e7ea",
  MU: "#9aa0a6",
  AC: "#6ae6b2",
};

type Competency = {
  id: string;
  name: string;
  difficulty: string;
  tags: string[] | null;
  created_at: string;
};

export default function CommitteeHome() {
  const [email, setEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<Competency[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        setEmail(u.user?.email ?? null);
        const { data, error } = await supabase
          .from("competencies")
          .select("id, name, difficulty, tags, created_at")
          .order("name", { ascending: true });
        if (error) throw error;
        if (!cancel) setRows((data ?? []) as Competency[]);
      } catch (e) {
        if (!cancel) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: T.BG, color: T.TX }}>
      <header style={{ borderBottom: `1px solid ${T.BR}` }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>
            Committee — Competency Framework
          </h1>
          <div style={{ fontSize: 13, color: T.MU }}>{email ?? ""}</div>
        </div>
      </header>

      <section
        style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 24px" }}
      >
        {loading && <div style={{ color: T.MU }}>Loading…</div>}
        {err && (
          <div
            style={{
              border: "1px solid #5c1d22",
              background: "#2a0f13",
              color: "#fecdd3",
              borderRadius: 12,
              padding: 10,
            }}
          >
            {err}
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div style={{ color: T.MU }}>No competencies yet.</div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
            gap: 12,
          }}
        >
          {rows.map((c) => (
            <article
              key={c.id}
              style={{
                background: T.SUR,
                border: `1px solid ${T.BR}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <h3 style={{ fontWeight: 600, lineHeight: 1.2 }}>{c.name}</h3>
                <span
                  style={{
                    background: T.AC,
                    color: "#0a0a0a",
                    padding: "4px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {c.difficulty}
                </span>
              </div>
              {c.tags && c.tags.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        border: `1px solid ${T.BR}`,
                        background: "#0e1014",
                        color: T.MU,
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                {/* future: link to committee edit/review page */}
                <a
                  href={`/committee/competency/${c.id}`}
                  style={{
                    fontSize: 13,
                    color: T.TX,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    opacity: 0.9,
                  }}
                >
                  Review →
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
