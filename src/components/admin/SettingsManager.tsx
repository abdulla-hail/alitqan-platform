"use client";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDemoContent, saveSetting, saveTemplate } from "@/features/admin/system-actions";
import { FieldEditor } from "./FieldEditor";
import { PageTitle, SubmitButton, Switch, Tabs, useAdmin, useResult } from "./ui";

type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const T = (ar: string, en: string) => ({ ar, en });

function StringList({ label, value, onChange, dir = "ltr", placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; dir?: string; placeholder?: string }) {
  const list = value ?? [];
  return (
    <div>
      <label className="label">{label}</label>
      <div className="space-y-2">
        {list.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input value={v} dir={dir} placeholder={placeholder} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} className="input" />
            <button type="button" className="btn btn-ghost btn-icon text-danger" onClick={() => onChange(list.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange([...list, ""])}><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function SettingsManager({ settings, templates, emailConfigured }: { settings: Obj; templates: Obj[]; emailConfigured: boolean }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const router = useRouter();
  const [tab, setTab] = useState("general");
  const [s, setS] = useState<Obj>(settings);
  const [tpls, setTpls] = useState<Obj[]>(templates);
  const [busy, setBusy] = useState(false);
  const upd = (key: string, patch: Obj) => setS((cur) => ({ ...cur, [key]: { ...(cur[key] ?? {}), ...patch } }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    let ok = true;
    if (tab === "notifications") {
      ok = result(await saveSetting("notifications", s.notifications ?? {}), "");
      for (const t of tpls) ok = result(await saveTemplate(t.key, t as never), "") && ok;
      if (ok) result({ ok: true });
    } else if (tab !== "sample") {
      ok = result(await saveSetting(tab, s[tab] ?? {}));
    }
    setBusy(false);
    if (ok) router.refresh();
  }
  const tabs = [
    { value: "general", label: ar ? "عام" : "General" },
    { value: "contact", label: ar ? "بيانات التواصل" : "Contact" },
    { value: "social", label: ar ? "التواصل الاجتماعي" : "Social" },
    { value: "seo", label: "SEO" },
    { value: "forms", label: ar ? "النماذج" : "Forms" },
    { value: "notifications", label: ar ? "الإشعارات والبريد" : "Notifications" },
    { value: "analytics", label: ar ? "التحليلات" : "Analytics" },
    { value: "sample", label: d.sample_content },
  ];
  const L = (name: string, kind: "text" | "textarea", label: { ar: string; en: string }, key: string) => (
    <FieldEditor field={{ name, kind, localized: true, label }} value={s[key]?.[name]} onChange={(v) => upd(key, { [name]: v })} />
  );
  return (
    <form onSubmit={save} className="pb-24">
      <PageTitle title={d.settings} />
      <div className="mb-6"><Tabs tabs={tabs} value={tab} onChange={setTab} /></div>
      <div className="card space-y-5 p-6">
        {tab === "general" && (
          <>
            <FieldEditor field={{ name: "site_url", kind: "url", label: T("رابط الموقع الأساسي", "Primary site URL") }} value={s.general?.site_url} onChange={(v) => upd("general", { site_url: v })} />
            {L("copyright", "text", T("اسم حقوق النشر", "Copyright holder"), "general")}
            <p className="text-sm text-muted">{ar ? "اسم العلامة والشعار والألوان في صفحة الهوية البصرية؛ اللغة الافتراضية في صفحة اللغات." : "Brand name, logo and colours live in Brand identity; the default language in Languages."}</p>
          </>
        )}
        {tab === "contact" && (
          <>
            <FieldEditor field={{ name: "email", kind: "text", label: T("البريد الإلكتروني", "Email") }} value={s.contact?.email} onChange={(v) => upd("contact", { email: v })} />
            <StringList label={ar ? "أرقام الهاتف" : "Phone numbers"} value={s.contact?.phones ?? []} onChange={(v) => upd("contact", { phones: v })} placeholder="+966 …" />
            <FieldEditor field={{ name: "whatsapp", kind: "text", label: T("رقم واتساب (بالصيغة الدولية)", "WhatsApp number (international)") }} value={s.contact?.whatsapp} onChange={(v) => upd("contact", { whatsapp: v })} />
            {L("address", "textarea", T("العنوان", "Address"), "contact")}
            {L("hours", "text", T("ساعات العمل", "Working hours"), "contact")}
            <FieldEditor field={{ name: "map_url", kind: "url", label: T("رابط الخريطة (Google Maps)", "Map link (Google Maps)") }} value={s.contact?.map_url} onChange={(v) => upd("contact", { map_url: v })} />
          </>
        )}
        {tab === "social" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {["linkedin", "x", "instagram", "behance", "dribbble", "github", "youtube", "tiktok", "facebook", "snapchat", "threads"].map((k) => (
              <label key={k} className="block"><span className="label capitalize">{k}</span><input dir="ltr" className="input" placeholder="https://" value={s.social?.[k] ?? ""} onChange={(e) => upd("social", { [k]: e.target.value })} /></label>
            ))}
          </div>
        )}
        {tab === "seo" && (
          <>
            {L("title_template", "text", T("قالب العنوان (%s = عنوان الصفحة)", "Title template (%s = page title)"), "seo")}
            {L("default_title", "text", T("العنوان الافتراضي (الرئيسية)", "Default title (home)"), "seo")}
            {L("default_description", "textarea", T("الوصف الافتراضي", "Default description"), "seo")}
            {L("keywords", "text", T("الكلمات المفتاحية", "Keywords"), "seo")}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldEditor field={{ name: "twitter_handle", kind: "text", label: T("حساب X (@handle)", "X handle (@handle)") }} value={s.seo?.twitter_handle} onChange={(v) => upd("seo", { twitter_handle: v })} />
              <FieldEditor field={{ name: "google_verification", kind: "text", label: T("رمز تحقق Google Search Console", "Google Search Console verification") }} value={s.seo?.google_verification} onChange={(v) => upd("seo", { google_verification: v })} />
            </div>
            <p className="text-sm text-muted">{ar ? "خريطة الموقع: /sitemap.xml · ملف الروبوتات: /robots.txt (يُولدان تلقائياً)." : "Sitemap: /sitemap.xml · Robots: /robots.txt (generated automatically)."}</p>
          </>
        )}
        {tab === "forms" && (
          <>
            <FieldEditor field={{ name: "budgets", kind: "list", label: T("خيارات الميزانية", "Budget options"), fields: [{ name: "v", kind: "text", localized: true, label: T("الخيار", "Option") }] }}
              value={(s.forms?.budgets ?? []).map((b: Obj) => ({ v: b }))} onChange={(v) => upd("forms", { budgets: (v as Obj[]).map((x) => x.v ?? {}) })} />
            <FieldEditor field={{ name: "timelines", kind: "list", label: T("خيارات المدة", "Timeline options"), fields: [{ name: "v", kind: "text", localized: true, label: T("الخيار", "Option") }] }}
              value={(s.forms?.timelines ?? []).map((b: Obj) => ({ v: b }))} onChange={(v) => upd("forms", { timelines: (v as Obj[]).map((x) => x.v ?? {}) })} />
          </>
        )}
        {tab === "notifications" && (
          <>
            <p className={`rounded-lg px-4 py-3 text-sm ${emailConfigured ? "bg-success/10 text-success" : "bg-warning/12 text-warning"}`}>
              {emailConfigured
                ? ar ? "مزود البريد مضبوط (Resend). ستُرسل الإشعارات للعناوين أدناه." : "Email provider configured (Resend). Notifications go to the addresses below."
                : ar ? "لم يُضبط مزود البريد بعد: أضف RESEND_API_KEY و EMAIL_FROM في متغيرات البيئة. الطلبات تُحفظ في لوحة التحكم دائماً." : "Email provider not configured: set RESEND_API_KEY and EMAIL_FROM. Requests are always saved in the dashboard."}
            </p>
            <StringList label={ar ? "عناوين استلام الإشعارات" : "Notification recipients"} value={s.notifications?.recipients ?? []} onChange={(v) => upd("notifications", { recipients: v })} placeholder="name@company.com" />
            {tpls.map((t, i) => (
              <fieldset key={t.key} className="space-y-3 rounded-[var(--radius-brand-sm)] border border-line p-4">
                <legend className="px-1 text-sm font-semibold">{t.key === "project_request" ? (ar ? "قالب: طلب مشروع" : "Template: project request") : t.key === "quote_request" ? (ar ? "قالب: طلب عرض سعر" : "Template: quote request") : ar ? "قالب: رسالة تواصل" : "Template: contact message"}</legend>
                <Switch checked={t.is_enabled} onChange={(v) => setTpls(tpls.map((x, j) => (j === i ? { ...x, is_enabled: v } : x)))} label={ar ? "مفعّل" : "Enabled"} />
                <FieldEditor field={{ name: "subject", kind: "text", localized: true, label: T("الموضوع", "Subject") }} value={t.subject} onChange={(v) => setTpls(tpls.map((x, j) => (j === i ? { ...x, subject: v } : x)))} />
                <FieldEditor field={{ name: "body", kind: "textarea", localized: true, label: T("النص", "Body") }} value={t.body} onChange={(v) => setTpls(tpls.map((x, j) => (j === i ? { ...x, body: v } : x)))} />
                <p className="text-xs text-muted" dir="ltr">{"{{reference}} {{name}} {{email}} {{phone}} {{company}} {{service}} {{budget}} {{timeline}} {{description}} {{subject}} {{message}} {{admin_url}}"}</p>
              </fieldset>
            ))}
          </>
        )}
        {tab === "analytics" && (
          <>
            <FieldEditor field={{ name: "ga_id", kind: "text", label: T("معرف Google Analytics 4 (G-XXXX)", "Google Analytics 4 ID (G-XXXX)") }} value={s.analytics?.ga_id} onChange={(v) => upd("analytics", { ga_id: v })} />
            <p className="text-sm text-muted">{ar ? "يُحمّل سكربت التحليلات في الموقع العام فقط عند إدخال المعرف." : "The analytics script loads on the public site only when an ID is set."}</p>
          </>
        )}
        {tab === "sample" && (
          <div className="space-y-4">
            <p>{ar ? "المحتوى التجريبي (الخدمات والمشاريع والمقالات والفريق والآراء والعملاء المعلّمة DEMO) يمكن حذفه دفعة واحدة. الصفحات والقوائم والإعدادات لا تُحذف." : "Seeded sample content (services, projects, articles, team, testimonials and clients marked DEMO) can be removed at once. Pages, menus and settings are kept."}</p>
            <button type="button" className="btn btn-danger" onClick={async () => {
              if (!confirm(ar ? "حذف كل المحتوى التجريبي نهائياً؟" : "Permanently delete all sample content?")) return;
              if (result(await deleteDemoContent(), d.delete)) router.refresh();
            }}><Trash2 className="h-4 w-4" />{ar ? "حذف المحتوى التجريبي" : "Delete sample content"}</button>
          </div>
        )}
      </div>
      {tab !== "sample" && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:start-[var(--sb)]">
          <div className="mx-auto flex max-w-5xl justify-end px-4 py-3"><SubmitButton busy={busy}>{busy ? d.saving : d.save}</SubmitButton></div>
        </div>
      )}
    </form>
  );
}
