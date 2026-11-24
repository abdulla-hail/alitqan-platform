import { describe, expect, it } from "vitest";
import { normalizeSocial, platformOf, SOCIAL_LIBRARY, SOCIAL_MAX, socialFor, socialName, socialUrls } from "./social";

describe("social platforms", () => {
  it("library covers the requested platforms with real icon paths", () => {
    for (const k of ["instagram", "x", "facebook", "linkedin", "tiktok", "snapchat", "youtube", "whatsapp", "telegram"]) {
      expect(SOCIAL_LIBRARY[k]?.path.length).toBeGreaterThan(20);
    }
  });
  it("reads the legacy key→url map without losing data", () => {
    const items = normalizeSocial({ linkedin: "https://linkedin.com/x", instagram: "https://instagram.com/y", x: "" });
    expect(items.map((i) => i.platform)).toEqual(["linkedin", "instagram"]);
    expect(items.every((i) => i.enabled && i.header && i.footer && i.contact)).toBe(true);
  });
  it("reads the ordered list format and cleans fields", () => {
    const items = normalizeSocial({ items: [{ id: "a<b>", platform: "TikTok!", label: '<b>"Hi"</b>', url: "https://t.co", enabled: false }] });
    expect(items[0]).toMatchObject({ id: "ab", platform: "tiktok", label: "bHi/b", enabled: false, header: true });
  });
  it("filters per place, hides disabled items and unsafe links", () => {
    const v = {
      items: [
        { id: "1", platform: "x", url: "https://x.com/a", header: true, footer: false },
        { id: "2", platform: "youtube", url: "javascript:alert(1)" },
        { id: "3", platform: "email", url: "mailto:hi@example.com", contact: true, header: false },
        { id: "4", platform: "facebook", url: "https://fb.com/a", enabled: false },
      ],
    };
    expect(socialFor(v, "header").map((i) => i.id)).toEqual(["1"]);
    expect(socialFor(v, "footer").map((i) => i.id)).toEqual(["3"]);
    expect(socialFor(v, "contact").map((i) => i.id)).toEqual(["1", "3"]);
    expect(socialUrls(v)).toEqual(["https://x.com/a"]);
  });
  it("unknown platforms fall back to the generic link icon; names default to the platform", () => {
    expect(platformOf({ platform: "myspace" })).toBe(SOCIAL_LIBRARY.link);
    expect(socialName({ platform: "whatsapp", label: "" })).toBe("WhatsApp");
    expect(socialName({ platform: "whatsapp", label: "Sales" })).toBe("Sales");
  });
  it("caps the number of platforms", () => {
    const many = { items: Array.from({ length: 50 }, (_, i) => ({ id: String(i), platform: "link", url: "https://e.com" })) };
    expect(normalizeSocial(many)).toHaveLength(SOCIAL_MAX);
  });
});
