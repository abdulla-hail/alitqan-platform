"use client";
import { Copy, FileText, Loader2, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { deleteMedia, mediaUsage, updateMedia, type MediaRow } from "@/features/admin/media-actions";
import { UploadProgressList, useMediaUploader } from "./MediaPicker";
import { MEDIA_ACCEPT } from "./media-upload";
import { FieldEditor } from "./FieldEditor";
import { Modal, PageTitle, useAdmin, useResult } from "./ui";

const FOLDERS = ["general", "brand", "projects", "blog", "team", "clients", "services", "documents", "fonts"];

export function MediaLibrary({ initial }: { initial: MediaRow[] }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("all");
  const [type, setType] = useState("all");
  const [uploadFolder, setUploadFolder] = useState("general");
  const [sel, setSel] = useState<MediaRow | null>(null);
  const [usage, setUsage] = useState<{ entity: string; id: string }[] | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, progress } = useMediaUploader(uploadFolder);

  const shown = useMemo(() => items.filter((m) =>
    (folder === "all" || m.folder === folder) &&
    (type === "all" || (type === "image" ? m.mime_type.startsWith("image/") : !m.mime_type.startsWith("image/"))) &&
    (!q || m.file_name.toLowerCase().includes(q.toLowerCase()))), [items, folder, type, q]);

  useEffect(() => {
    setUsage(null);
    if (!sel) return;
    mediaUsage(sel.url).then((r) => r.ok && setUsage(r.data ?? []));
  }, [sel]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const added = await upload(files);
    if (added.length) {
      setItems((cur) => [...added, ...cur]);
      result({ ok: true }, `${added.length} ✓`);
    }
  }
  const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${Math.round(b / 1024)} KB`);

  return (
    <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}>
      <PageTitle title={d.media} subtitle={ar ? "الصور تُضغط وتُحوّل إلى WebP تلقائياً قبل الرفع (حد أقصى 10MB)." : "Images are compressed to WebP before upload (max 10 MB)."}
        actions={
          <div className="flex gap-2">
            <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} className="input w-36" aria-label={d.folder}>{FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
            <button className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{busy ? d.uploading : d.upload}</button>
            <input ref={input} type="file" multiple accept={MEDIA_ACCEPT} className="sr-only" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
          </div>
        } />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.search} className="input ps-9" /></label>
        <select value={folder} onChange={(e) => setFolder(e.target.value)} className="input"><option value="all">{d.folder}: {d.all}</option>{FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input"><option value="all">{d.type}: {d.all}</option><option value="image">{ar ? "صور" : "Images"}</option><option value="doc">{ar ? "ملفات" : "Documents"}</option></select>
      </div>
      <UploadProgressList items={progress} />
      <div className={`rounded-xl transition ${drag ? "ring-4 ring-primary/40" : ""}`}>
        {shown.length === 0 ? (
          <div className="card grid place-items-center gap-2 p-14 text-muted"><Upload className="h-8 w-8" />{ar ? "اسحب الملفات وأفلتها هنا" : "Drag & drop files here"}</div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {shown.map((m) => (
              <li key={m.id}>
                <button onClick={() => setSel(m)} className="card card-hover block w-full overflow-hidden text-start">
                  <div className="grid aspect-square place-items-center bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {m.mime_type.startsWith("image/") ? <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <FileText className="h-10 w-10 text-muted" />}
                  </div>
                  <div className="p-2"><p className="truncate text-xs font-medium" dir="ltr">{m.file_name}</p><p className="text-[11px] text-muted">{m.folder} · {size(m.size_bytes)}</p></div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={d.details} wide>
        {sel && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="grid place-items-center rounded-lg bg-subtle p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {sel.mime_type.startsWith("image/") ? <img src={sel.url} alt="" className="max-h-96 rounded object-contain" /> : <a href={sel.url} target="_blank" rel="noreferrer" className="btn btn-outline"><FileText className="h-5 w-5" />{d.open}</a>}
            </div>
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-2 gap-2">
                <dt className="text-muted">{d.type}</dt><dd dir="ltr">{sel.mime_type}</dd>
                <dt className="text-muted">{d.size}</dt><dd>{size(sel.size_bytes)}</dd>
                {sel.width && (<><dt className="text-muted">px</dt><dd dir="ltr">{sel.width}×{sel.height}</dd></>)}
                <dt className="text-muted">{d.used_in}</dt>
                <dd>{usage == null ? <Loader2 className="h-4 w-4 animate-spin" /> : usage.length ? usage.map((u) => u.entity).filter((v, i, a) => a.indexOf(v) === i).join(", ") : <span className="text-success">{d.unused}</span>}</dd>
              </dl>
              <div className="flex gap-2"><input readOnly value={sel.url} dir="ltr" className="input text-xs" /><button className="btn btn-outline btn-icon" onClick={() => { navigator.clipboard.writeText(sel.url); result({ ok: true }, d.copied); }}><Copy className="h-4 w-4" /></button></div>
              <FieldEditor field={{ name: "alt", kind: "text", localized: true, label: { ar: d.alt_text, en: d.alt_text } }} value={sel.alt} onChange={(v) => setSel({ ...sel, alt: v as Record<string, string> })} />
              <div>
                <label className="label">{d.folder}</label>
                <select className="input" value={sel.folder} onChange={(e) => setSel({ ...sel, folder: e.target.value })}>{FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <button className="btn btn-primary" onClick={async () => { if (result(await updateMedia(sel.id, { alt: sel.alt, folder: sel.folder }))) setItems((cur) => cur.map((x) => (x.id === sel.id ? sel : x))); }}>{d.save}</button>
                <button className="btn btn-outline text-danger" disabled={!!usage?.length} title={usage?.length ? d.used_in : ""} onClick={async () => {
                  if (!confirm(d.confirm_delete)) return;
                  if (result(await deleteMedia(sel.id), d.delete)) { setItems((cur) => cur.filter((x) => x.id !== sel.id)); setSel(null); }
                }}><Trash2 className="h-4 w-4" />{d.delete}</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
