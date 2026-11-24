import Image from "next/image";
import { publicEnv } from "@/lib/env";

/**
 * Images from the CMS: optimised through next/image when they live in Supabase
 * Storage; SVGs and other hosts are rendered as lazy <img> (no optimiser needed).
 */
export function SmartImage({
  src, alt, className, sizes = "(min-width: 1024px) 50vw, 100vw", priority = false, fill = true, width, height,
}: { src?: string | null; alt: string; className?: string; sizes?: string; priority?: boolean; fill?: boolean; width?: number; height?: number }) {
  if (!src) return null;
  const optimisable = !src.endsWith(".svg") && publicEnv.supabaseUrl && src.startsWith(publicEnv.supabaseUrl);
  if (optimisable) {
    return fill ? (
      <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} />
    ) : (
      <Image src={src} alt={alt} width={width ?? 1200} height={height ?? 800} sizes={sizes} className={className} priority={priority} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      width={width}
      height={height}
      className={fill ? `absolute inset-0 h-full w-full ${className ?? ""}` : className}
    />
  );
}
