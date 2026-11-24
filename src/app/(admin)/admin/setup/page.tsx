import { notFound } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { SetupForm } from "@/components/admin/AuthForms";
import { authStrings } from "@/features/admin/auth-strings";
import { getAdminLocale } from "@/lib/admin-context";
import { serverEnv } from "@/lib/server-env";
import { createServiceClient } from "@/lib/supabase/clients";

/**
 * First-owner bootstrap. Disappears (404) once an active super admin exists or
 * when SETUP_TOKEN is not set — there is no default account or password anywhere.
 */
export default async function SetupPage() {
  if (!serverEnv.setupToken || !serverEnv.serviceRoleKey) notFound();
  const { count, error } = await createServiceClient().from("profiles").select("id", { count: "exact", head: true }).eq("role_key", "super_admin").eq("is_active", true);
  if (error || count) notFound();
  const t = authStrings(await getAdminLocale());
  return (
    <AuthCard title={t.setup_title} subtitle={t.setup_sub}>
      <SetupForm t={t} />
    </AuthCard>
  );
}
