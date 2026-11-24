import { BrandSymbol } from "@/components/brand/Logo";

/** Auth screens: branded ink panel (desktop) + form card. Mobile shows the form with the symbol only. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh grid-cols-1 bg-bg lg:grid-cols-2" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <aside className="ink relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12" aria-hidden>
        <div className="bg-measure pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute -top-32 end-[-10%] h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl animate-glow" />
        <BrandSymbol className="relative h-12 w-12" />
        <BrandSymbol className="pointer-events-none absolute -bottom-24 start-[-4rem] h-[30rem] w-[30rem] opacity-[0.07]" />
        <div className="relative">
          <p className="kicker">CMS</p>
          <p className="mt-3 max-w-sm text-3xl font-bold leading-tight">إتقان · ALITQAN</p>
          <div className="ruler mt-10 text-on-ink" />
        </div>
      </aside>
      <div className="relative grid place-items-center px-4 py-10">
        <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 opacity-60 lg:hidden" aria-hidden />
        <div className="relative w-full max-w-md" data-anim="up">
          <BrandSymbol className="h-11 w-11 lg:hidden" />
          <h1 className="mt-5 text-3xl font-bold lg:mt-0">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="card mt-8 p-6 shadow-[var(--shadow-md)] sm:p-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
