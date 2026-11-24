import { AuthCard } from "@/components/admin/AuthCard";
import { ForgotForm } from "@/components/admin/AuthForms";
import { authStrings } from "@/features/admin/auth-strings";
import { getAdminLocale } from "@/lib/admin-context";

export default async function ForgotPage() {
  const t = authStrings(await getAdminLocale());
  return (
    <AuthCard title={t.reset_title}>
      <ForgotForm t={t} />
    </AuthCard>
  );
}
