import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { LoginForm } from "@/components/admin/AuthForms";
import { authStrings } from "@/features/admin/auth-strings";
import { getAdminLocale } from "@/lib/admin-context";
import { getStaff } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getStaff()) redirect("/admin");
  const t = authStrings(await getAdminLocale());
  const { next } = await searchParams;
  return (
    <AuthCard title={t.login} subtitle={t.login_sub}>
      <LoginForm t={t} next={next} />
    </AuthCard>
  );
}
