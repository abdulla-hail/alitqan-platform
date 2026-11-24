"use client";
import { FileText, ImagePlus, Loader2, Search, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { listMedia, registerMedia, type MediaRow } from "@/features/admin/media-actions";
import { MEDIA_ACCEPT, uploadToMedia } from "./media-upload";
import { Modal, useAdmin, useCan, useResult } from "./ui";

export interface UploadProgress { name: string; p: number; state: "uploading" | "done" | "error"; error?: string }

/** Uploads files to the media library with per-file progress (and failure) state. */
export function useMediaUploader(folder: string) {
  const { toast, d } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      setBusy(true);
      setProgress(list.map((f) => ({ name: f.name, p: 0, state: "uploading" })));
      const set = (i: number, patch: Partial<UploadProgress>) => setProgress((cur) => cur.map((x, j) => (j === i ? { ...x, ...patch } : x)));
      const out: MediaRow[] = [];
      for (const [i, f] of list.entries()) {
        try {
          const up = await uploadToMedia(f, folder, (pr) => set(i, { p: pr }));
          const res = await registerMedia({ ...up, folder });
          if (res.ok && res.data) { out.push(res.data); set(i, { p: 1, state: "done" }); }
          else { set(i, { state: "error", error: d.error_generic }); toast(d.error_generic, "error"); }
        } catch (e) {
          const msg = e instanceof Error && e.message === "too_large" ? "> 10MB" : e instanceof Error && e.message === "type" ? d.type : d.error_generic;
          set(i, { state: "error", error: msg });
          toast(`${f.name}: ${msg}`, "error");
        }
      }
      setBusy(false);
      window.setTimeout(() => setProgress((cur) => cur.filter((x) => x.state === "error")), 2500);
      return out;
    },
    [folder, toast, d],
  );
  return { upload, busy, progress };
}

export function UploadProgressList({ items }: { items: UploadProgress[] }) {
  if (!items.length) return null;
  return (
    <ul className="mb-4 space-y-2" aria-live="polite">
      {items.map((x, i) => (
        <li key={i} className="card p-3 text-sm" data-anim="fade">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate" dir="ltr">{x.name}</span>
            <span className={`text-xs font-semibold ${x.state === "error" ? "text-danger" : x.state === "done" ? "text-success" : "text-muted"}`}>
              {x.state === "error" ? x.error : x.state === "done" ? "✓" : `${Math.round(x.p * 100)}%`}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuenow={Math.round(x.p * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={x.name}>
            <div className={`h-full rounded-full transition-[width] duration-300 ${x.state === "error" ? "bg-danger" : "bg-primary"}`} style={{ width: `${x.state === "error" ? 100 : Math.max(4, x.p * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Modal to pick (or upload) a file from the central media library. */
export function MediaPicker({ open, onClose, onPick, imagesOnly = true, folder = "general" }: { open: boolean; onClose: () => void; onPick: (m: MediaRow) => void; imagesOnly?: boolean; folder?: string }) {
  const { d } = useAdmin();
  const can = useCan();
  const result = useResult();
  const [items, setItems] = useState<MediaRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, progress } = useMediaUploader(folder);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listMedia({ search: q, imagesOnly });
    if (result(res, "") && res.ok) setItems(res.data ?? []);
    setLoading(false);
  }, [q, imagesOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [open, load]);

  return (
    <Modal open={open} onClose={onClose} title={d.media} wide>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.search} className="input ps-9" />
        </label>
        {can("media.manage") && (
          <>
            <button type="button" className="btn btn-primary" onClick={() => input.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {busy ? d.uploading : d.upload}
            </button>
            <input
              ref={input}
              type="file"
              multiple
              accept={imagesOnly ? "image/*" : MEDIA_ACCEPT}
              className="sr-only"
              onChange={async (e) => {
                if (!e.target.files?.length) return;
                const added = await upload(e.target.files);
                setItems((cur) => [...added, ...cur]);
                if (added.length === 1) {
                  onPick(added[0]);
                  onClose();
                }
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>
      <UploadProgressList items={progress} />
      {loading && !items.length ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
      ) : items.length === 0 ? (
        <div className="grid place-items-center gap-2 py-16 text-muted"><ImagePlus className="h-8 w-8" />{d.no_items}</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => { onPick(m); onClose(); }} className="group block w-full overflow-hidden rounded-lg border border-line text-start hover:border-primary">
                <div className="grid aspect-square place-items-center bg-subtle">
                  {m.mime_type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-8 w-8 text-muted" />
                  )}
                </div>
                <p className="truncate px-2 py-1.5 text-xs" dir="ltr">{m.file_name}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
