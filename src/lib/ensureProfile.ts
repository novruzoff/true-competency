import type { SupabaseClient, User } from "@supabase/supabase-js";

type AppRole = "trainee" | "instructor" | "committee";

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  // include other columns if you have them (e.g., is_admin)
};

/**
 * Ensures a `profiles` row exists for the current user.
 * - If missing, inserts with sensible defaults.
 * - If present, returns it.
 * Never throws on "row missing"—only on network/permission errors.
 */
export async function ensureProfile(
  supabase: SupabaseClient
): Promise<ProfileRow | null> {
  // Get current user
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const user: User | null = authData.user ?? null;
  if (!user) return null;

  // Try to read existing profile
  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (selErr) throw selErr;
  if (existing) return existing;

  // Insert a new profile with defaults
  const defaultRole: AppRole = "trainee";
  const { data: inserted, error: insErr } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name: null,
      role: defaultRole,
    })
    .select("id, email, full_name, role")
    .single<ProfileRow>();

  if (insErr) throw insErr;
  return inserted;
}