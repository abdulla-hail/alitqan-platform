"use client";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { createOwner, requestPasswordReset, signIn, updatePassword, type AuthState } from "@/features/admin/auth-actions";

type T = Record<string, string>;
const msg = (t: T, code?: string) => (code ? t[`e_${code}`] ?? t.e_generic : "");

function Btn({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button className="btn btn-primary w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
function Err({ text }: { text: string }) {
  return text ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{text}</p> : null;
}

export function LoginForm({ t, next }: { t: T; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/admin"} />
      <div><label className="label" htmlFor="email">{t.email}</label><input id="email" name="email" type="email" autoComplete="username" required dir="ltr" className="input" /></div>
      <div><label className="label" htmlFor="password">{t.password}</label><input id="password" name="password" type="password" autoComplete="current-password" required dir="ltr" className="input" /></div>
      <Err text={msg(t, state?.error)} />
      <Btn pending={pending}>{t.login}</Btn>
      <Link href="/admin/forgot-password" className="block text-center text-sm text-primary hover:underline">{t.forgot_password}</Link>
    </form>
  );
}

export function ForgotForm({ t }: { t: T }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, undefined);
  if (state?.ok) return <p className="rounded-lg bg-success/10 px-3 py-3 text-sm text-success">{t.reset_sent}</p>;
  return (
    <form action={action} className="space-y-4">
      <div><label className="label" htmlFor="email">{t.email}</label><input id="email" name="email" type="email" required dir="ltr" className="input" /></div>
      <Btn pending={pending}>{t.send_reset}</Btn>
      <Link href="/admin/login" className="block text-center text-sm text-primary hover:underline">{t.login}</Link>
    </form>
  );
}

export function ResetForm({ t }: { t: T }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, undefined);
  if (state?.ok) return (<div className="space-y-4"><p className="rounded-lg bg-success/10 px-3 py-3 text-sm text-success">{t.password_updated}</p><Link href="/admin" className="btn btn-primary w-full">{t.dashboard}</Link></div>);
  return (
    <form action={action} className="space-y-4">
      <div><label className="label" htmlFor="password">{t.new_password}</label><input id="password" name="password" type="password" minLength={10} autoComplete="new-password" required dir="ltr" className="input" /></div>
      <div><label className="label" htmlFor="confirm">{t.confirm_password}</label><input id="confirm" name="confirm" type="password" minLength={10} autoComplete="new-password" required dir="ltr" className="input" /></div>
      <p className="text-xs text-muted">{t.password_rule}</p>
      <Err text={msg(t, state?.error)} />
      <Btn pending={pending}>{t.update_password}</Btn>
    </form>
  );
}

export function SetupForm({ t }: { t: T }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(createOwner, undefined);
  if (state?.ok) return (<div className="space-y-4"><p className="rounded-lg bg-success/10 px-3 py-3 text-sm text-success">{t.owner_created}</p><Link href="/admin/login" className="btn btn-primary w-full">{t.login}</Link></div>);
  return (
    <form action={action} className="space-y-4">
      <div><label className="label" htmlFor="token">SETUP_TOKEN</label><input id="token" name="token" type="password" required dir="ltr" className="input" autoComplete="off" /></div>
      <div><label className="label" htmlFor="name">{t.full_name}</label><input id="name" name="name" required minLength={2} className="input" /></div>
      <div><label className="label" htmlFor="email">{t.email}</label><input id="email" name="email" type="email" required dir="ltr" className="input" autoComplete="username" /></div>
      <div><label className="label" htmlFor="password">{t.password}</label><input id="password" name="password" type="password" minLength={12} required dir="ltr" className="input" autoComplete="new-password" /><p className="mt-1 text-xs text-muted">{t.owner_password_rule}</p></div>
      <Err text={msg(t, state?.error)} />
      <Btn pending={pending}>{t.create_owner}</Btn>
    </form>
  );
}
