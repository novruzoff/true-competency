// src/app/debug/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DebugClient from "./DebugClient";

export const dynamic = "force-dynamic"; // ensure fresh auth on each request

export default async function DebugPage() {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    redirect("/signin?redirect=/debug");
  }

  // Check admin membership
  const { data: adminRow, error: adminErr } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // If the policy blocks or row doesn't exist -> treat as non-admin
  if (adminErr || !adminRow) {
    redirect("/"); // or redirect("/403") if you have a 403 page
  }

  // Authorized: render the client UI
  return <DebugClient />;
}
