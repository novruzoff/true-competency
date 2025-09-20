import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Dashboard() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2">Hello {user?.email}</p>
    </main>
  );
}
