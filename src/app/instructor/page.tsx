// src/app/instructor/page.tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";
import InstructorClient from "./page.client";

export default async function InstructorPage() {
  const supabase = await getSupabaseServer();

  // Secure auth check (contacts Auth server)
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) {
    redirect("/signin?redirect=/instructor");
  }

  // Role/Admin gate
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  let isAdmin = !!profile?.is_admin;

  if (!isAdmin) {
    const { data: adminRow } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = !!adminRow;
  }

  if (!isAdmin && profile?.role !== "instructor") {
    redirect("/403");
  }

  return <InstructorClient />;
}
