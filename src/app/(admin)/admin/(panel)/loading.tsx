import { BrandSymbol } from "@/components/brand/Logo";

/** Skeleton shown instantly while any CMS page loads its data. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3">
        <BrandSymbol className="h-9 w-9 motion-safe:animate-pulse" />
        <div className="skeleton h-9 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-28" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="skeleton h-72 lg:col-span-3" />
        <div className="skeleton h-72 lg:col-span-2" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
