"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, LayoutTemplate } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { saveRecord } from "@/features/admin/actions";
import { publicUrl, RESOURCE_MAP } from "@/features/admin/resources";
import { FieldEditor, type RelationOptions } from "./FieldEditor";
import { L, SubmitButton, Tabs, useAdmin, useResult } from "./ui";

export function ResourceForm({ resourceKey, record, relations }: { resourceKey: string; record: Record<string, unknown> | null; relations: RelationOptions }) {
  const def = RESOURCE_MAP[resourceKey];
  const { d, locale } = useAdmin();
  const result = useResult();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of def.fields) init[f.name] = record?.[f.name] ?? f.default ?? (f.kind === "status" ? "draft" : f.kind === "boolean" ? f.name === "is_visible" || f.name === "show_in_sitemap" : undefined);
    if (!record && def.key === "pages") init.kind = "custom";
    return init;
  });
  const [tab, setTab] = useState("content");
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const saved = useRef(JSON.stringify(values));
  const dirty = JSON.stringify(values) !== saved.current;
  const { languages } = useAdmin();
  const defLang = languages.find((l) => l.is_default)?.code ?? "ar";
  // Never lose edits: warn before closing/reloading the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  const isMissing = (f: (typeof def.fields)[number]) => {
    if (!f.required) return false;
    const v = values[f.name];
    return f.localized ? !(v as Record<string, string> | undefined)?.[defLang]?.trim() : v == null || String(v).trim() === "";
  };
  const tabs = (["content", "media", "settings", "seo"] as const).filter((t) => def.fields.some((f) => (f.tab ?? "content") === t));
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const title = L(values[def.titleField], locale) || def.singular[locale];
  const pub = record ? publicUrl(def, record, locale) : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const miss = def.fields.filter(isMissing);
    setMissing(miss.map((f) => f.name));
    if (miss.length) {
      setTab(miss[0].tab ?? "content");
      return;
    }
    setBusy(true);
    const res = await saveRecord(resourceKey, (record?.id as string) ?? null, values);
    setBusy(false);
    if (res.ok) saved.current = JSON.stringify(values);
    if (result(res) && res.ok && !record && res.data) router.replace(resourceKey === "pages" ? `/admin/pages/${res.data.id}` : `/admin/r/${resourceKey}/${res.data.id}`);
    else if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/admin/r/${resourceKey}`} className="btn btn-ghost btn-icon" aria-label={d.back}><Back className="h-5 w-5" /></Link>
          <div className="min-w-0">
            <p className="text-sm text-muted">{def.label[locale]}</p>
            <h1 className="truncate text-2xl font-bold">{record ? title : `${d.new} ${def.singular[locale]}`}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {resourceKey === "pages" && record && (
            <Link href={`/admin/pages/${record.id}`} className="btn btn-outline"><LayoutTemplate className="h-4 w-4" />{d.sections}</Link>
          )}
          {pub && record?.status === "published" && (
            <a href={pub} target="_blank" rel="noreferrer" className="btn btn-outline"><ExternalLink className="h-4 w-4" />{d.preview}</a>
          )}
        </div>
      </div>
      {tabs.length > 1 && (
        <div className="mb-6">
          <Tabs value={tab} onChange={setTab} tabs={tabs.map((t) => ({ value: t, label: d[`${t}_tab` as const] }))} />
        </div>
      )}
      {missing.length > 0 && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger" role="alert" data-anim="fade">
          {d.required}: {def.fields.filter((f) => missing.includes(f.name)).map((f) => f.label[locale]).join("، ")}
          {" — "}{locale === "ar" ? "باللغة الافتراضية على الأقل" : "at least in the default language"}
        </div>
      )}
      <div key={tab} className="card space-y-6 p-5 sm:p-7 animate-rise">
        {def.fields
          .filter((f) => (f.tab ?? "content") === tab)
          .map((f) => (
            <div key={f.name} className={missing.includes(f.name) && isMissing(f) ? "rounded-lg ring-2 ring-danger/50 ring-offset-4 ring-offset-surface" : ""}>
              <FieldEditor field={f} value={values[f.name]} onChange={(v) => setValues((cur) => ({ ...cur, [f.name]: v }))} relations={relations} />
            </div>
          ))}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:start-[var(--sb)]">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-2 px-4 py-3">
          {dirty && <span className="me-auto inline-flex items-center gap-2 text-xs text-warning"><span className="h-2 w-2 rounded-full bg-warning" />{locale === "ar" ? "تغييرات غير محفوظة" : "Unsaved changes"}</span>}
          <Link href={`/admin/r/${resourceKey}`} className="btn btn-ghost" onClick={(e) => { if (dirty && !confirm(locale === "ar" ? "لديك تغييرات غير محفوظة. المغادرة؟" : "Discard unsaved changes?")) e.preventDefault(); }}>{d.cancel}</Link>
          <SubmitButton busy={busy}>{busy ? d.saving : d.save}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
