import { AccountForms } from "@/components/admin/AccountForms";
import { authStrings } from "@/features/admin/auth-strings";
import { getAdminLocale } from "@/lib/admin-context";
import { requirePage } from "@/lib/auth";

export default async function AccountPage() {
  const staff = await requirePage();
  const t = authStrings(await getAdminLocale());
  return <AccountForms t={t} name={staff.full_name ?? ""} email={staff.email} />;
}
