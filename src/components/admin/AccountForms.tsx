"use client";
import { useState } from "react";
import { updateOwnProfile } from "@/features/admin/user-actions";
import { ResetForm } from "./AuthForms";
import { PageTitle, SubmitButton, useAdmin, useResult } from "./ui";

export function AccountForms({ t, name: initial, email }: { t: Record<string, string>; name: string; email: string }) {
  const { d } = useAdmin();
  const result = useResult();
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <div className="max-w-xl space-y-6">
      <PageTitle title={d.account} subtitle={email} />
      <form className="card space-y-4 p-6" onSubmit={async (e) => { e.preventDefault(); setBusy(true); result(await updateOwnProfile({ full_name: name })); setBusy(false); }}>
        <label className="block"><span className="label">{t.full_name}</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <SubmitButton busy={busy}>{d.save}</SubmitButton>
      </form>
      <div className="card p-6">
        <h2 className="mb-4 font-bold">{t.update_password}</h2>
        <ResetForm t={t} />
      </div>
    </div>
  );
}
