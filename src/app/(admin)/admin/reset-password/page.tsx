import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { ResetForm } from "@/components/admin/AuthForms";
import { authStrings } from "@/features/admin/auth-strings";
import { getAdminLocale } from "@/lib/admin-context";
import { createSessionClient } from "@/lib/supabase/clients";

/** Reached from the emailed recovery link (via /auth/callback, which established a session). */
export default async function ResetPage() {
  const sb = await createSessionClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) redirect("/admin/forgot-password");
  const t = authStrings(await getAdminLocale());
  return (
    <AuthCard title={t.update_password}>
      <ResetForm t={t} />
    </AuthCard>
  );
}
