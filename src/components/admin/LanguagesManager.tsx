"use client";
import { Plus, Search, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteLanguage, deleteTranslationKey, saveLanguage, saveTranslations, setDefaultLanguage } from "@/features/admin/system-actions";
import { Modal, PageTitle, SubmitButton, Switch, Tabs, useAdmin, useResult } from "./ui";

interface Lang { code: string; name: string; native_name: string; dir: "rtl" | "ltr"; is_enabled: boolean; is_default: boolean }

export function LanguagesManager({ languages, translations }: { languages: Lang[]; translations: { key: string; locale: string; value: string }[] }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const router = useRouter();
  const [tab, setTab] = useState("strings");
  const [q, setQ] = useState("");
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<Lang | null>(null);
  const [newKey, setNewKey] = useState("");

  const table = useMemo(() => {
    const map = new Map<string, Record<string, string>>();
    for (const t of translations) map.set(t.key, { ...(map.get(t.key) ?? {}), [t.locale]: t.value });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [translations]);
  const visible = table.filter(([k, v]) => !q || k.includes(q.toLowerCase()) || Object.values(v).some((x) => x.toLowerCase().includes(q.toLowerCase())));
  const val = (k: string, l: string, base?: string) => dirty[`${k}|${l}`] ?? base ?? "";

  async function saveStrings() {
    setBusy(true);
    const rows = Object.entries(dirty).map(([kl, value]) => { const [key, loc] = kl.split("|"); return { key, locale: loc, value }; });
    const ok = result(await saveTranslations(rows));
    setBusy(false);
    if (ok) { setDirty({}); router.refresh(); }
  }

  return (
    <div className="pb-24">
      <PageTitle title={d.languages} subtitle={ar ? "إدارة لغات الموقع ونصوص الواجهة (القوائم، الأزرار، رسائل النظام). محتوى الصفحات يُترجم داخل كل عنصر." : "Manage site languages and interface strings (menus, buttons, system messages). Page content is translated inside each item."} />
      <div className="mb-6"><Tabs value={tab} onChange={setTab} tabs={[{ value: "strings", label: ar ? "نصوص الواجهة" : "Interface strings" }, { value: "languages", label: ar ? "اللغات" : "Languages" }]} /></div>

      {tab === "languages" && (
        <div className="space-y-3">
          {languages.map((l) => (
            <div key={l.code} className="card flex flex-wrap items-center gap-4 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-soft font-mono font-bold text-primary">{l.code}</span>
              <div className="min-w-0 flex-1"><p className="font-semibold">{l.native_name} <span className="text-sm text-muted">({l.name}, {l.dir.toUpperCase()})</span></p></div>
              {l.is_default ? (
                <span className="inline-flex items-center gap-1 rounded-pill bg-accent-soft px-3 py-1 text-xs font-bold"><Star className="h-3.5 w-3.5" />{ar ? "الافتراضية" : "Default"}</span>
              ) : (
                <button className="btn btn-outline btn-sm" onClick={async () => { if (result(await setDefaultLanguage(l.code))) router.refresh(); }}>{ar ? "اجعلها الافتراضية" : "Make default"}</button>
              )}
              <Switch checked={l.is_enabled} disabled={l.is_default} onChange={async (v) => { if (result(await saveLanguage({ ...l, is_enabled: v }))) router.refresh(); }} label={ar ? "مفعّلة" : "Enabled"} />
              {!l.is_default && <button className="btn btn-ghost btn-icon text-danger" onClick={async () => { if (confirm(d.confirm_delete) && result(await deleteLanguage(l.code), d.delete)) router.refresh(); }}><Trash2 className="h-4 w-4" /></button>}
            </div>
          ))}
          <button className="btn btn-primary" onClick={() => setAdding({ code: "", name: "", native_name: "", dir: "ltr", is_enabled: false, is_default: false })}><Plus className="h-4 w-4" />{ar ? "إضافة لغة" : "Add language"}</button>
          <p className="text-sm text-muted">{ar ? "اللغة الجديدة تُضاف معطلة؛ ترجم نصوص الواجهة والمحتوى ثم فعّلها لتظهر في الموقع." : "New languages start disabled; translate strings and content, then enable them."}</p>
        </div>
      )}

      {tab === "strings" && (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.search} className="input ps-9" /></label>
            <div className="flex gap-2">
              <input value={newKey} onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))} placeholder="group.new_key" className="input font-mono text-sm" dir="ltr" />
              <button className="btn btn-outline" disabled={!newKey} onClick={() => { setDirty({ ...dirty, [`${newKey}|${languages[0]?.code}`]: "" }); setQ(newKey); setNewKey(""); }}><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-line text-start text-muted"><th className="p-3 text-start font-semibold">Key</th>{languages.map((l) => <th key={l.code} className="p-3 text-start font-semibold">{l.native_name}</th>)}<th /></tr></thead>
              <tbody>
                {[...visible, ...Object.keys(dirty).map((kl) => kl.split("|")[0]).filter((k) => !table.some(([t]) => t === k)).filter((k, i, a) => a.indexOf(k) === i).map((k) => [k, {}] as [string, Record<string, string>])].map(([k, v]) => (
                  <tr key={k} className="border-b border-line/60 align-top">
                    <td className="p-3 font-mono text-xs text-muted" dir="ltr">{k}</td>
                    {languages.map((l) => (
                      <td key={l.code} className="p-2">
                        <textarea rows={1} dir={l.dir} value={val(k, l.code, v[l.code])} onChange={(e) => setDirty({ ...dirty, [`${k}|${l.code}`]: e.target.value })}
                          className={`input min-h-10 resize-y py-2 text-sm ${dirty[`${k}|${l.code}`] != null ? "border-accent" : ""} ${!val(k, l.code, v[l.code]) ? "bg-warning/8" : ""}`} />
                      </td>
                    ))}
                    <td className="p-2"><button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={async () => { if (confirm(d.confirm_delete) && result(await deleteTranslationKey(k), d.delete)) router.refresh(); }}><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:start-[var(--sb)]">
            <div className="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 py-3">
              {Object.keys(dirty).length > 0 && <span className="text-sm text-muted">{Object.keys(dirty).length} ✎</span>}
              <form onSubmit={(e) => { e.preventDefault(); saveStrings(); }}><SubmitButton busy={busy} disabled={!Object.keys(dirty).length}>{busy ? d.saving : d.save}</SubmitButton></form>
            </div>
          </div>
        </>
      )}

      <Modal open={!!adding} onClose={() => setAdding(null)} title={ar ? "إضافة لغة" : "Add language"}
        footer={<form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (adding && result(await saveLanguage({ ...adding, is_new: true }))) { setAdding(null); router.refresh(); } }}><button type="button" className="btn btn-ghost" onClick={() => setAdding(null)}>{d.cancel}</button><SubmitButton busy={false}>{d.save}</SubmitButton></form>}>
        {adding && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label><span className="label">{ar ? "الرمز (ISO)" : "Code (ISO)"}</span><input className="input font-mono" dir="ltr" placeholder="fr" value={adding.code} onChange={(e) => setAdding({ ...adding, code: e.target.value.trim() })} /></label>
            <label><span className="label">{ar ? "الاتجاه" : "Direction"}</span><select className="input" value={adding.dir} onChange={(e) => setAdding({ ...adding, dir: e.target.value as "rtl" | "ltr" })}><option value="ltr">LTR</option><option value="rtl">RTL</option></select></label>
            <label><span className="label">{ar ? "الاسم بالإنجليزية" : "English name"}</span><input className="input" dir="ltr" value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} /></label>
            <label><span className="label">{ar ? "الاسم الأصلي" : "Native name"}</span><input className="input" value={adding.native_name} onChange={(e) => setAdding({ ...adding, native_name: e.target.value })} /></label>
          </div>
        )}
      </Modal>
    </div>
  );
}
