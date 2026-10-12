// SPDX-FileCopyrightText: 2026 Aesthetic Vulpes (github.com/didvc)
// SPDX-License-Identifier: AGPL-3.0-only
// Parse /clock/<token>/<token>/... into validated options. Only whitelisted keywords are accepted.
import { parseZone } from "./time.js";

export const THEMES = ["auto", "light", "dark", "transparent"];
export const LABELS = { "label-city": "city", "label-local": "local", "label-my": "my", nolabel: "none" };
export const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const bounded = (v, min, max) => Math.min(max, Math.max(min, v));

export function parseOptions(segments) {
  const opts = {
    zone: parseZone("utc"), palette: "github", style: "digital", h12: false, seconds: false, date: false, offset: true, label: "city",
    work: null, sleep: [23, 7], workdays: [1, 2, 3, 4, 5], kaomoji: false,
    theme: "auto", card: false, border: 0, size: 40, color: null,
  };
  if (segments.length > 16 || segments.join("/").length > 512) return { error: "too many options" };
  for (let i = 0; i < segments.length; i++) {
    let t = String(segments[i]).toLowerCase();
    if (i === segments.length - 1) t = t.replace(/\.svg$/, "");
    if (!t) continue;
    let m, z;
    if ((z = parseZone(t))) opts.zone = z;
    else if (t === "digital" || t === "analog") opts.style = t;
    else if (t === "12h" || t === "24h") opts.h12 = t === "12h";
    else if (t === "seconds") opts.seconds = true;
    else if (t === "date") opts.date = true;
    else if (t === "nooffset") opts.offset = false;
    else if (t in LABELS) opts.label = LABELS[t];
    else if (t === "kaomoji") opts.kaomoji = true;
    else if (t === "everyday") opts.workdays = [0, 1, 2, 3, 4, 5, 6];
    else if (THEMES.includes(t)) opts.theme = t;
    else if (t === "card") opts.card = true;
    else if (t === "warm") opts.palette = "warm";
    else if ((m = t.match(/^work-(\d{1,2})-(\d{1,2})$/)) && +m[1] < 24 && +m[2] <= 24 && +m[1] !== +m[2]) opts.work = [+m[1], +m[2]];
    else if ((m = t.match(/^sleep-(\d{1,2})-(\d{1,2})$/)) && +m[1] < 24 && +m[2] <= 24 && +m[1] !== +m[2]) opts.sleep = [+m[1], +m[2]];
    else if ((m = t.match(/^days-(sun|mon|tue|wed|thu|fri|sat)-(sun|mon|tue|wed|thu|fri|sat)$/))) {
      const a = DAYS.indexOf(m[1]), b = DAYS.indexOf(m[2]);
      opts.workdays = Array.from({ length: ((b - a + 7) % 7) + 1 }, (_, k) => (a + k) % 7);
    }
    else if (t === "px") opts.px = true;
    else if ((m = t.match(/^size-(\d{1,4}(?:\.\d{1,3})?)(rem)?$/))) opts.size = bounded(Math.round(+m[1] * (m[2] ? 16 : 1)), 16, 96);
    else if ((m = t.match(/^border-(\d{1,2})$/))) { opts.border = bounded(+m[1], 0, 8); opts.card = true; }
    else if ((m = t.match(/^color-([0-9a-f]{3}|[0-9a-f]{6})$/))) opts.color = m[1];
    else return { error: `unknown option #${i + 1}` };
  }
  return { opts };
}

// Is hour h inside the window [a, b) that may wrap past midnight?
export const inWindow = (h, [a, b]) => (a < b ? h >= a && h < b : h >= a || h < b);
