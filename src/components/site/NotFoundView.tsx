"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandSymbol } from "@/components/brand/Logo";

export function NotFoundView({ strings }: { strings: Record<string, { title: string; text: string; home: string }> }) {
  const seg = usePathname()?.split("/")[1] ?? "";
  const locale = strings[seg] ? seg : Object.keys(strings)[0];
  const s = strings[locale];
  return (
    <section className="section">
      <div className="container-x flex flex-col items-center text-center">
        <BrandSymbol className="h-20 w-20 animate-float" />
        <p className="mt-6 font-display text-6xl font-bold text-primary">404</p>
        <h1 className="h-section mt-4">{s?.title}</h1>
        <p className="lead mt-3 max-w-md">{s?.text}</p>
        <Link href={`/${locale ?? ""}`} className="btn btn-primary mt-8">{s?.home}</Link>
      </div>
    </section>
  );
}
