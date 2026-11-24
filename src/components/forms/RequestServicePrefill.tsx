"use client";
import { useEffect, useRef } from "react";

/** Pre-selects ?service=<slug> in the request form without making the page dynamic. */
export function RequestServicePrefill({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("service");
    const select = ref.current?.querySelector<HTMLSelectElement>("select[name=service]");
    if (slug && select && [...select.options].some((o) => o.value === slug)) select.value = slug;
  }, []);
  return <div ref={ref}>{children}</div>;
}
