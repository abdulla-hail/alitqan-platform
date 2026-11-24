// Dev check: renders the vector mark beside / over the reference artwork.
// Run: node scripts/brand-compare.ts <out.png>
import sharp from "sharp";
import { markDocument, MARK_DEFAULT_COLORS } from "../src/lib/brand/mark.ts";
const out = process.argv[2];
const svg = markDocument({ viewBox: "0 0 1536 1024", colors: MARK_DEFAULT_COLORS, background: { fill: "#ffffff" } });
const mine = await sharp(Buffer.from(svg)).resize(768, 512).png().toBuffer();
const ref = await sharp("brand-source/logo-reference.webp").resize(768, 512).png().toBuffer();
// overlay: reference at 50% under mine at 50%
const overlay = await sharp(ref).composite([{ input: await sharp(mine).ensureAlpha(0.5).png().toBuffer(), blend: "over" }]).png().toBuffer();
await sharp({ create: { width: 1536, height: 1024, channels: 3, background: "#fff" } })
  .composite([{ input: ref, left: 0, top: 0 }, { input: mine, left: 768, top: 0 }, { input: overlay, left: 384, top: 512 }])
  .png().toFile(out);
