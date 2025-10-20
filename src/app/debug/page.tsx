// src/app/debug/page.tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";
import DebugClient from "./DebugClient";

export const dynamic = "force-dynamic"; // always read fresh cookies/session

export default async function DebugPage() {
  // ✅ Server-side Supabase bound to request cookies
  const supabase = await getSupabaseServer();

  // Auth gate
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (userErr || !user) {
    // Preserve desired destination after sign-in
    redirect(`/signin?redirect=${encodeURIComponent("/debug")}`);
  }

  // Admin gate (via RLS-safe lookup)
  const { data: adminRow, error: adminErr } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminErr || !adminRow) {
    redirect("/"); // or redirect("/403") if you have a 403 page
  }

  // Authorized
  return <DebugClient />;
}
