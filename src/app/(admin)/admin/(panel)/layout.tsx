import { AdminShell } from "@/components/admin/AdminShell";
import { AdminProvider } from "@/components/admin/ui";
import { getAdminDict, getAdminLocale, getContentLanguages } from "@/lib/admin-context";
import { can, requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requirePage();
  const [d, locale, languages, sb] = await Promise.all([getAdminDict(), getAdminLocale(), getContentLanguages(), createSessionClient()]);
  let counts = { requests: 0, messages: 0 };
  if (can(staff, "inbox.view")) {
    const [r, m] = await Promise.all([
      sb.from("project_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);
    counts = { requests: r.count ?? 0, messages: m.count ?? 0 };
  }
  const { data: role } = await sb.from("roles").select("name").eq("key", staff.role_key).maybeSingle();
  return (
    <AdminProvider d={d} locale={locale} languages={languages} permissions={[...staff.permissions]} role={staff.role_key}>
      <AdminShell user={{ email: staff.email, name: staff.full_name, role: (role?.name as Record<string, string>)?.[locale] ?? staff.role_key }} counts={counts}>
        {children}
      </AdminShell>
    </AdminProvider>
  );
}
