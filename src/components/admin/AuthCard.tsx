import { BrandSymbol } from "@/components/brand/Logo";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-bg px-4 py-10">
      <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 opacity-80" aria-hidden />
      <div className="card relative w-full max-w-md p-7 shadow-xl sm:p-9">
        <BrandSymbol className="h-12 w-12" />
        <h1 className="mt-5 text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </main>
  );
}
