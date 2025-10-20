// src/app/account/page.tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";
import AccountClient from "./page.client";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin?redirect=/account");
  }

  return <AccountClient email={user.email ?? ""} />;
}
