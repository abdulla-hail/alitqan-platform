import { getImageProps } from "next/image";
import { publicEnv } from "@/lib/env";

export interface PreparedImage {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

const optimisable = (src: string) => !src.endsWith(".svg") && Boolean(publicEnv.supabaseUrl) && src.startsWith(publicEnv.supabaseUrl);

/**
 * Responsive image attributes (AVIF/WebP via the Next optimizer) for images in
 * Supabase Storage; SVG/other hosts are passed through untouched. Used for art
 * direction (<picture> with a separate mobile image) in client components.
 */
export function prepareImage(src: string | null | undefined, sizes: string, width = 1600, height = 1000): PreparedImage | null {
  if (!src) return null;
  if (!optimisable(src)) return { src };
  const { props } = getImageProps({ src, alt: "", width, height, sizes, quality: 78 });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes, width, height };
}
