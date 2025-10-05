import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function ensureProfile() {
  const { data: u, error: uerr } = await supabase.auth.getUser();
  if (uerr || !u.user) return;

  const id = u.user.id;
  const email = u.user.email ?? '';

  // Try to fetch first to avoid a write if it already exists
  const { data: p } = await supabase.from('profiles').select('id').eq('id', id).single();

  if (!p) {
    await supabase.from('profiles').upsert(
      { id, email, role: 'trainee' as any }, // enum on server; TS is fine with 'as any'
      { onConflict: 'id' }
    );
  }
}
