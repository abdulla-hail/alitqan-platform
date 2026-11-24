"use client";
import Link from "next/link";
import { CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { prepareUploads, submitRequest } from "@/features/forms/actions";
import { getBrowserClient } from "@/lib/supabase/browser";
import { Field, useAntiBot } from "./FormKit";

const ALLOWED = ".pdf,.jpg,.jpeg,.png,.webp,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";
const MAX = 10 * 1024 * 1024;

export function RequestForm({
  t, locale, services, budgets, timelines, initialService, privacyHref,
}: {
  t: Record<string, string>;
  locale: string;
  services: { value: string; label: string; group: string }[];
  budgets: string[];
  timelines: string[];
  initialService?: string;
  privacyHref: string;
}) {
  const { token, turnstile, refresh, Honeypot, Widget } = useAntiBot();
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<"idle" | "uploading" | "sending" | "done">("idle");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [bad, setBad] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (f.size > MAX || !ALLOWED.split(",").some((ext) => f.name.toLowerCase().endsWith(ext))) {
        setError(t["form.error_file"]);
        continue;
      }
      if (next.length < 5) next.push(f);
    }
    setFiles(next);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError("");
    setBad([]);
    let attachments: { path: string; name: string }[] = [];
    try {
      if (files.length) {
        setState("uploading");
        const prep = await prepareUploads({ token, files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })) });
        if (!prep.ok) throw new Error(prep.error);
        const storage = getBrowserClient().storage.from("request-attachments");
        await Promise.all(
          prep.uploads.map(async (u, i) => {
            const { error: upErr } = await storage.uploadToSignedUrl(u.path, u.token, files[i], { contentType: files[i].type });
            if (upErr) throw new Error("file");
          }),
        );
        attachments = prep.uploads.map((u, i) => ({ path: u.path, name: files[i].name }));
      }
      setState("sending");
      const res = await submitRequest({
        token, turnstile, locale, website: String(fd.get("website") ?? ""),
        kind: fd.get("kind"), name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") || undefined, company: fd.get("company") || undefined,
        service: fd.get("service") || undefined, description: fd.get("description"), budget: fd.get("budget") || undefined, timeline: fd.get("timeline") || undefined,
        consent: fd.get("consent") === "on", attachments,
      });
      if (res.ok) {
        setReference(res.reference ?? "");
        setState("done");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setBad(res.fields ?? []);
      setError(res.error === "validation" ? t["form.error_validation"] : res.error === "rate" ? t["form.error_rate"] : res.error === "file" ? t["form.error_file"] : t["form.error_generic"]);
    } catch (err) {
      setError(err instanceof Error && err.message === "file" ? t["form.error_file"] : err instanceof Error && err.message === "rate" ? t["form.error_rate"] : t["form.error_generic"]);
    }
    setState("idle");
    refresh();
  }

  if (state === "done") {
    return (
      <div className="card flex flex-col items-center p-10 text-center animate-rise sm:p-14" role="status">
        <CheckCircle2 className="h-14 w-14 text-success" aria-hidden />
        <h2 className="mt-5 text-2xl font-bold">{t["form.success_title"]}</h2>
        <p className="mt-2 text-muted">{t["form.success_text"]}</p>
        {reference && (
          <p className="mt-6 rounded-pill bg-soft px-5 py-2 font-semibold">
            {t["form.reference"]}: <span dir="ltr" className="font-mono">{reference}</span>
          </p>
        )}
      </div>
    );
  }

  const busy = state !== "idle";
  const err = (f: string, msg = t["form.required"]) => (bad.includes(f) ? msg : undefined);
  const inv = (f: string) => (bad.includes(f) ? { "aria-invalid": true as const } : {});
  const groups = [...new Set(services.map((s) => s.group))];
  return (
    <form onSubmit={onSubmit} className="card relative space-y-6 p-6 sm:p-10" noValidate>
      {Honeypot}
      <fieldset>
        <legend className="label">{t["form.kind"]}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["project", "quote"] as const).map((k) => (
            <label key={k} className="flex cursor-pointer items-center gap-3 rounded-brand-sm border border-line p-4 has-[:checked]:border-primary has-[:checked]:bg-soft">
              <input type="radio" name="kind" value={k} defaultChecked={k === "project"} className="accent-[var(--color-primary)]" />
              <span className="font-semibold">{t[`form.kind_${k}`]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="name" label={t["form.name"]} required error={err("name")}>
          <input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="input" {...inv("name")} />
        </Field>
        <Field id="email" label={t["form.email"]} required error={err("email", t["form.invalid_email"])}>
          <input id="email" name="email" type="email" required autoComplete="email" dir="ltr" className="input" {...inv("email")} />
        </Field>
        <Field id="phone" label={t["form.phone"]} error={err("phone")}>
          <input id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" dir="ltr" className="input" {...inv("phone")} />
        </Field>
        <Field id="company" label={t["form.company"]}>
          <input id="company" name="company" maxLength={160} autoComplete="organization" className="input" />
        </Field>
      </div>
      <Field id="service" label={t["form.service"]}>
        <select id="service" name="service" defaultValue={initialService ?? ""} className="input">
          <option value="">{t["form.select"]}</option>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {services.filter((s) => s.group === g).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </optgroup>
          ))}
          <option value="other">{t["form.service_other"]}</option>
        </select>
      </Field>
      <Field id="description" label={t["form.description"]} required hint={t["form.description_hint"]} error={err("description")}>
        <textarea id="description" name="description" required minLength={10} maxLength={8000} rows={7} className="input" {...inv("description")} />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="budget" label={t["form.budget"]}>
          <select id="budget" name="budget" className="input" defaultValue="">
            <option value="">{t["form.select"]}</option>
            {budgets.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field id="timeline" label={t["form.timeline"]}>
          <select id="timeline" name="timeline" className="input" defaultValue="">
            <option value="">{t["form.select"]}</option>
            {timelines.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
      </div>
      <div>
        <span className="label">{t["form.attachments"]}</span>
        <button type="button" onClick={() => fileInput.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-brand-sm border-2 border-dashed border-line p-6 text-muted transition-colors hover:border-primary hover:text-primary"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
          <FileUp className="h-6 w-6" aria-hidden />
          <span className="text-sm">{t["form.attachments_hint"]}</span>
        </button>
        <input ref={fileInput} type="file" multiple accept={ALLOWED} className="sr-only" onChange={(e) => addFiles(e.target.files)} />
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2 text-sm">
                <span className="truncate" dir="ltr">{f.name} <span className="text-muted">({(f.size / 1024 / 1024).toFixed(1)} MB)</span></span>
                <button type="button" aria-label="Remove" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-muted hover:text-danger"><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[var(--color-primary)]" {...inv("consent")} />
        <span>
          {t["form.consent"]} <Link href={privacyHref} target="_blank" className="font-semibold text-primary underline">{t["form.privacy_link"]}</Link>
          {bad.includes("consent") && <span className="field-error block">{t["form.required"]}</span>}
        </span>
      </label>
      {Widget}
      {error && <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary min-h-12 w-full px-6 sm:w-auto" disabled={busy || !token} aria-busy={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {busy ? t["form.sending"] : t["form.submit_request"]}
      </button>
    </form>
  );
}
