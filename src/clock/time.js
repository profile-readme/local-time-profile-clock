// SPDX-FileCopyrightText: 2026 Aesthetic Vulpes (github.com/didvc)
// SPDX-License-Identifier: AGPL-3.0-only
// Time zones and offsets. Zone tokens are IANA names, lowercased, with "/" replaced by "-":
// Asia/Tokyo -> asia-tokyo, America/Argentina/Buenos_Aires -> america-argentina-buenos_aires.
// Fixed offsets are written utc+9, utc-5, utc+0530.
const ZONES = (() => {
  try { return Intl.supportedValuesOf("timeZone"); } catch { return []; }
})();
export const zoneToken = (zone) => zone.toLowerCase().replace(/\//g, "-");
const BY_TOKEN = new Map([["utc", "UTC"], ...ZONES.map((z) => [zoneToken(z), z])]);
export const ALL_ZONES = ZONES;

export function parseZone(token) {
  const m = token.match(/^utc([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (m) {
    const h = +m[2], mm = +(m[3] ?? 0);
    if (h > 14 || ![0, 15, 30, 45].includes(mm)) return null;
    return { fixed: (m[1] === "-" ? -1 : 1) * (h * 60 + mm), city: null };
  }
  const zone = BY_TOKEN.get(token);
  if (!zone) return null;
  return { zone, city: zone === "UTC" ? null : zone.split("/").pop().replace(/_/g, " ") };
}

// Minutes east of UTC for this zone at this instant (handles daylight saving time).
export function offsetMinutes(z, date) {
  if (z.fixed !== undefined) return z.fixed;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: z.zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const g = (t) => +parts.find((p) => p.type === t).value;
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

export function formatOffset(min) {
  const a = Math.abs(min), h = Math.floor(a / 60), m = a % 60;
  return `UTC${min < 0 ? "-" : "+"}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
}
