"use client";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { submitContact } from "@/features/forms/actions";
import { Field, useAntiBot } from "./FormKit";

export function ContactForm({ t, locale }: { t: Record<string, string>; locale: string }) {
  const { token, turnstile, refresh, Honeypot, Widget } = useAntiBot();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [bad, setBad] = useState<string[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    setError("");
    const res = await submitContact({
      token, turnstile, locale, website: String(fd.get("website") ?? ""),
      name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") || undefined, subject: fd.get("subject") || undefined, message: fd.get("message"),
    });
    if (res.ok) {
      setState("done");
      return;
    }
    setState("idle");
    setBad(res.fields ?? []);
    setError(res.error === "validation" ? t["form.error_validation"] : res.error === "rate" ? t["form.error_rate"] : t["form.error_generic"]);
    refresh();
  }

  if (state === "done") {
    return (
      <div className="card flex flex-col items-center p-10 text-center animate-rise" role="status">
        <CheckCircle2 className="h-12 w-12 text-success" aria-hidden />
        <p className="mt-4 text-lg font-semibold">{t["form.message_sent"]}</p>
      </div>
    );
  }
  const inv = (f: string) => (bad.includes(f) ? { "aria-invalid": true as const, "aria-describedby": `${f}-error` } : {});
  return (
    <form onSubmit={onSubmit} className="card relative space-y-5 p-6 sm:p-8" noValidate>
      {Honeypot}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="name" label={t["form.name"]} required error={bad.includes("name") ? t["form.required"] : undefined}>
          <input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="input" {...inv("name")} />
        </Field>
        <Field id="email" label={t["form.email"]} required error={bad.includes("email") ? t["form.invalid_email"] : undefined}>
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" dir="ltr" className="input" {...inv("email")} />
        </Field>
        <Field id="phone" label={t["form.phone"]}>
          <input id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" dir="ltr" className="input" {...inv("phone")} />
        </Field>
        <Field id="subject" label={t["form.subject"]}>
          <input id="subject" name="subject" maxLength={200} className="input" />
        </Field>
      </div>
      <Field id="message" label={t["form.message"]} required error={bad.includes("message") ? t["form.required"] : undefined}>
        <textarea id="message" name="message" required minLength={5} maxLength={5000} rows={6} className="input" {...inv("message")} />
      </Field>
      {Widget}
      {error && <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary min-h-12 w-full px-6 sm:w-auto" disabled={state === "sending" || !token} aria-busy={state === "sending"}>
        {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {state === "sending" ? t["form.sending"] : t["form.submit"]}
      </button>
    </form>
  );
}
