// src/lib/ensureProfile.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "trainee" | "instructor" | "committee";

export async function ensureProfile(
  supabase: SupabaseClient,
  role: AppRole = "trainee"
) {
  // who am I?
  const { data: u, error: uErr } = await supabase.auth.getUser();
  if (uErr) throw uErr;
  if (!u.user) return null;

  // one call, idempotent
  const { data: _, error: rpcErr } = await supabase.rpc("ensure_profile_rpc", {
    p_email: u.user.email ?? null,
    p_role: role,
    p_first_name: u.user.user_metadata?.first_name ?? null,
    p_last_name:  u.user.user_metadata?.last_name ?? null,
  });
  if (rpcErr) throw rpcErr;

  // fetch fresh profile (optional)
  const { data: prof, error: selErr } = await supabase
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, role, created_at")
    .eq("id", u.user.id)
    .maybeSingle();
  if (selErr) throw selErr;

  return prof ?? null;
}