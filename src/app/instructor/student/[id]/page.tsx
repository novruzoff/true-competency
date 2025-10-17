// src/app/instructor/student/[id]/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabaseServer";

/* ----------------------------- Types ----------------------------- */
type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: "trainee" | "instructor" | "committee";
  is_admin?: boolean | null;
};

type Competency = {
  id: string;
  name: string | null;
  difficulty: string | null;
  tags: string[] | null;
  created_at?: string | null;
};

type ProgressRow = {
  student_id: string;
  competency_id: string;
  total_questions: number;
  answered_questions: number;
  pct: number;
};

type StudentCompetencyRow = ProgressRow & {
  competency: Competency;
};

function displayName(p: Pick<Profile, "first_name" | "last_name" | "email">) {
  const n = [p.first_name ?? "", p.last_name ?? ""].join(" ").trim();
  return n || p.email || "Unnamed trainee";
}

/* --------------------------- Page (RSC) -------------------------- */
export default async function InstructorStudentPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await getSupabaseServer();

  // Auth check (contacts Auth server)
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) redirect(`/signin?redirect=/instructor/student/${params.id}`);

  // Role/Admin gate
  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "role" | "is_admin">>();

  let isAdmin = !!me?.is_admin;

  if (!isAdmin) {
    const { data: adminRow } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = !!adminRow;
  }

  if (!isAdmin && me?.role !== "instructor") {
    redirect("/403");
  }

  // Load student profile
  const { data: stu, error: stuErr } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role")
    .eq("id", params.id)
    .maybeSingle<Profile>();

  if (stuErr || !stu) {
    // Student not found or not visible via RLS
    return (
      <main className="min-h-[calc(100svh-8rem)] bg-[var(--background)] text-[var(--foreground)]">
        <section className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Student not found
          </h1>
          <div className="accent-underline mt-3" />
          <p className="mt-4 text-sm md:text-base text-[var(--muted)]">
            The requested trainee does not exist or you don&apos;t have
            permission to view their data.
          </p>
          <div className="mt-6">
            <Link
              href="/instructor"
              className="text-[var(--accent)] underline underline-offset-4"
            >
              ← Back to instructor dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Load progress rows for student
  const { data: progress, error: progErr } = await supabase
    .from("student_competency_progress")
    .select(
      "student_id, competency_id, total_questions, answered_questions, pct"
    )
    .eq("student_id", stu.id)
    .returns<ProgressRow[]>();

  if (progErr) {
    return (
      <main className="min-h-[calc(100svh-8rem)] bg-[var(--background)] text-[var(--foreground)]">
        <section className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            {displayName(stu)}
          </h1>
          <div className="accent-underline mt-3" />
          <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {progErr.message}
          </div>
          <div className="mt-6">
            <Link
              href="/instructor"
              className="text-[var(--accent)] underline underline-offset-4"
            >
              ← Back to instructor dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const rows = progress ?? [];
  const ids = Array.from(new Set(rows.map((r) => r.competency_id)));

  // Load competencies referenced in progress
  let compMap = new Map<string, Competency>();
  if (ids.length > 0) {
    const { data: comps } = await supabase
      .from("competencies")
      .select("id, name, difficulty, tags, created_at")
      .in("id", ids)
      .returns<Competency[]>();

    if (comps && comps.length > 0) {
      compMap = new Map<string, Competency>(
        comps.map((c: Competency) => [c.id, c])
      );
    }
  }

  const merged: StudentCompetencyRow[] = rows.map(
    (r: ProgressRow): StudentCompetencyRow => ({
      ...r,
      competency: compMap.get(r.competency_id) ?? {
        id: r.competency_id,
        name: null,
        difficulty: null,
        tags: null,
      },
    })
  );

  merged.sort((a: StudentCompetencyRow, b: StudentCompetencyRow) => {
    if (a.pct !== b.pct) return a.pct - b.pct;
    const an = a.competency.name ?? a.competency.id;
    const bn = b.competency.name ?? b.competency.id;
    return an.localeCompare(bn);
  });

  const assignedCount = merged.length;
  const avgPct =
    assignedCount === 0
      ? 0
      : Math.round(
          merged.reduce(
            (acc: number, r: StudentCompetencyRow) => acc + r.pct,
            0
          ) / assignedCount
        );

  /* ------------------------------- UI ------------------------------ */
  return (
    <main className="min-h-[calc(100svh-8rem)] bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <section className="mx-auto max-w-5xl px-6 pt-10 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {displayName(stu)}
            </h1>
            <div className="accent-underline mt-3" />
            <p className="mt-3 text-sm md:text-base text-[var(--muted)]">
              Assigned topics and progress overview. You can open a topic to
              review answers and grade where applicable.
            </p>
          </div>

          <div className="text-right text-sm text-[var(--muted)]">
            <div>
              Assigned topics:{" "}
              <span className="text-[var(--foreground)] font-medium">
                {assignedCount}
              </span>
            </div>
            <div>
              Average progress:{" "}
              <span className="text-[var(--foreground)] font-medium">
                {avgPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Grid of competencies */}
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {merged.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">
              No assignments yet.
            </div>
          ) : (
            merged.map((r: StudentCompetencyRow) => {
              const title = r.competency.name ?? r.competency.id.slice(0, 8);
              const diff = r.competency.difficulty ?? "—";
              return (
                <article
                  key={r.competency_id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold leading-tight">{title}</h3>
                      <div className="text-xs text-[var(--muted)]">
                        Difficulty: {diff}
                      </div>
                    </div>
                    <span className="rounded-full bg-[color:var(--accent)] px-2.5 py-1 text-[10px] font-bold text-white">
                      {r.answered_questions}/{r.total_questions}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-[var(--muted)]">
                    Progress:{" "}
                    <span className="text-[var(--foreground)] font-medium">
                      {r.pct}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--field)]">
                    <div
                      className="h-full"
                      style={{
                        width: `${r.pct}%`,
                        background: "var(--accent)",
                        boxShadow:
                          "0 0 0 1px color-mix(in oklab, var(--accent) 20%, transparent) inset",
                      }}
                    />
                  </div>

                  <div className="mt-3 flex justify-end gap-3">
                    <Link
                      href={`/instructor/student/${stu.id}/competency/${r.competency_id}`}
                      className="text-sm text-[var(--accent)] underline underline-offset-4 hover:opacity-80"
                      title="Open competency to review answers"
                    >
                      Review →
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="mt-8">
          <Link
            href="/instructor"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            ← Back to instructor dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
